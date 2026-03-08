import { SpecimenSheet } from "@/components/specimen-sheet";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Type Specimen
        </h1>
        <p className="text-muted text-sm max-w-lg">
          A classic specimen sheet for exploring the character set, weight range,
          and personality of each variable font.
        </p>
      </div>
      <SpecimenSheet />
    </div>
  );
}
