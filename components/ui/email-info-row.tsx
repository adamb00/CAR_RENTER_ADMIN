import { BRAND } from '@/lib/constants';

export const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <tr>
    <td
      style={{
        padding: '6px 0',
        fontSize: '13px',
        color: BRAND.navy,
        fontWeight: 600,
        width: '40%',
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: '6px 0',
        fontSize: '13px',
        color: BRAND.navyLight,
      }}
    >
      {value ?? '—'}
    </td>
  </tr>
);
