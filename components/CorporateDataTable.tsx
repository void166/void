import { corporateProfile } from "@/lib/data/corporate";

export default function CorporateDataTable() {
  return (
    <div className="border border-line">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-line">
          {corporateProfile.dataRows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="w-1/3 px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-fog">
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
