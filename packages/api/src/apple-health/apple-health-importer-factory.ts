import { pipeline } from "stream/promises";
import unzipper from "unzipper";
import { MedplumClient } from "@medplum/core";
import type { BundleEntry, Observation } from "@medplum/fhirtypes";
import { type XmlTag, XmlTagStream } from "../common/streams/xml-tag-stream.js";
import {
  AppleHealthRecord,
  isSupportedRecord,
  mapPatient,
  mapRecord,
} from "./apple-health-mapper.js";
import type { Readable } from "node:stream";
import { inBatchesOf } from "../common/streams/in-batches-of.js";

export type AppleHealthImporterOptions = {
  medplum: MedplumClient;
};
export type AppleHealthImporter = ReturnType<typeof appleHealthImporterFactory>;

export const appleHealthImporterFactory = ({ medplum }: AppleHealthImporterOptions) => {
  async function createPatientRef(tag: XmlTag): Promise<string> {
    const patient = await medplum.createResource(
      mapPatient({
        dateOfBirth: tag.attributes.HKCharacteristicTypeIdentifierDateOfBirth,
        biologicalSex: tag.attributes.HKCharacteristicTypeIdentifierBiologicalSex,
      }),
    );
    return `Patient/${patient.id}`;
  }

  type XmlTagWithPatientRef = { tag: XmlTag; patientRef: string };
  async function* attachPatientRef(
    source: AsyncIterable<XmlTag>,
  ): AsyncGenerator<XmlTagWithPatientRef> {
    let patientRef: string | undefined;
    for await (const tag of source) {
      if (tag.name === "Me") patientRef = await createPatientRef(tag);
      else if (tag.name === "Record") {
        if (!patientRef) throw new Error("Record tag appeared before Me tag");
        yield { tag, patientRef };
      }
    }
  }

  type RecordWithPatientRef = { tag: { attributes: AppleHealthRecord }; patientRef: string };
  async function* filterSupportedRecords(
    source: AsyncIterable<RecordWithPatientRef>,
  ): AsyncGenerator<RecordWithPatientRef> {
    for await (const item of source) {
      if (isSupportedRecord(item.tag.attributes)) yield item;
    }
  }

  async function* createObservations(source: AsyncIterable<RecordWithPatientRef>) {
    const batchSize = 100;
    for await (const batch of inBatchesOf(source, batchSize)) {
      await executeObservationsBatch(
        batch.map(({ tag, patientRef }) => mapRecord(tag.attributes, patientRef)),
      );
    }
  }

  async function executeObservationsBatch(observations: Observation[]) {
    await medplum.executeBatch({
      resourceType: "Bundle",
      type: "batch",
      entry: observations.map(
        (resource): BundleEntry => ({
          resource,
          request: { method: "POST", url: "Observation" },
        }),
      ),
    });
  }

  return {
    async import(zippedFileStream: Readable) {
      const exportStream = zippedFileStream.pipe(unzipper.ParseOne(/export.xml/));
      await pipeline(
        exportStream,
        new XmlTagStream(["Me", "Record"]),
        attachPatientRef,
        filterSupportedRecords,
        createObservations,
      );
    },
  };
};
