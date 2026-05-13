import type { ProductSpecification } from '../../types/catalog'

type Props = {
  specifications: ProductSpecification[]
}

export function SpecificationTable({ specifications }: Props) {
  if (!specifications?.length) {
    return (
      <p className="text-sm text-[rgb(var(--muted))]">Specifications will be listed here when available.</p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/12">
      <table className="w-full text-sm">
        <tbody>
          {specifications.map((row, idx) => (
            <tr
              key={`${row.title}-${idx}`}
              className={idx % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.07]'}
            >
              <th
                scope="row"
                className="w-[40%] border-b border-white/10 px-4 py-3 text-left font-medium text-[rgb(var(--muted))]"
              >
                {row.title}
              </th>
              <td className="border-b border-white/10 px-4 py-3 font-medium text-[rgb(var(--fg))]">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
