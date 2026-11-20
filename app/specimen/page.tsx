import { SpecimenSheet } from "@/components/specimen-sheet";

export default function SpecimenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Specimen</h1>
        <p className="text-muted text-sm max-w-lg">
          A specimen sheet for each role in your system: character set, weight range, pangrams and running text.
        </p>
      </div>
      <SpecimenSheet />
    </div>
  );
}
