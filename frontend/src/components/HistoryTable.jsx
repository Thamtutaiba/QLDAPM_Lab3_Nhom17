// HistoryTable.jsx
export default function HistoryTable({ items = [] }) {
  return (
    <table className="history-table">
      <thead>
        <tr>
          <th>Ảnh</th>
          <th>Top Labels</th>
          <th>Thời gian</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.id}>
            <td>
              <img
                src={`https://${import.meta.env.VITE_S3_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${it.s3key}`}
                alt="classified"
                width="100"
              />
            </td>
            <td>
              {(it.labels || []).slice(0, 3).map((l) => (
                <div key={l.name || l.Name}>
                  {l.name || l.Name} ({(l.confidence ?? l.Confidence).toFixed(1)}%)
                </div>
              ))}
            </td>
            <td>{new Date(it.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
