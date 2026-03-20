import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PatientSelect } from "./PatientSelect";
import type { Patient } from "./patients";

const patients: Patient[] = [
  { id: "p1", gender: "male", birthDate: "1990-01-15" },
  { id: "p2", gender: "female", birthDate: "1985-06-20" },
];

describe("given no patients", () => {
  beforeEach(() => {
    render(<PatientSelect patients={[]} value="" onChange={vi.fn()} />);
  });

  it("should render the select", () => {
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

describe("given patients with all fields", () => {
  beforeEach(async () => {
    render(<PatientSelect patients={patients} value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("combobox"));
  });

  it("should render one option per patient", () => {
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("should display gender and birthDate", () => {
    expect(screen.getByRole("option", { name: "male · 1990-01-15" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "female · 1985-06-20" })).toBeInTheDocument();
  });
});

describe("given a patient with no gender", () => {
  beforeEach(async () => {
    render(<PatientSelect patients={[{ id: "p1" }]} value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("combobox"));
  });

  it("should fall back to 'Unknown'", () => {
    expect(screen.getByRole("option", { name: /Unknown/ })).toBeInTheDocument();
  });
});

describe("given a patient with no birthDate", () => {
  beforeEach(async () => {
    render(<PatientSelect patients={[{ id: "p1", gender: "male" }]} value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("combobox"));
  });

  it("should fall back to 'No DOB'", () => {
    expect(screen.getByRole("option", { name: /No DOB/ })).toBeInTheDocument();
  });
});

describe("given the user selects a patient", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    onChange = vi.fn();
    render(<PatientSelect patients={patients} value="" onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "male · 1990-01-15" }));
  });

  it("should call onChange with the patient id", () => {
    expect(onChange).toHaveBeenCalledWith("p1");
  });
});
