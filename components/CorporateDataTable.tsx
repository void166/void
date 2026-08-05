import { corporateProfile } from "@/lib/data/corporate";

export default function CorporateDataTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <table className="w-full text-left text-sm">
        <tbody>
          {corporateProfile.dataRows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-ink-2" : "bg-ink"}>
              <th scope="row" className="w-1/3 px-6 py-4 font-medium text-mist">
                {row.label}
              </th>
              <td className="px-6 py-4 text-paper">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
