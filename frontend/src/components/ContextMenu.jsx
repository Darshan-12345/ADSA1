export default function ContextMenu({ menu, onMarkTemp, onMarkImportant }) {
  if (!menu) return null;

  return (
    <div className="context-menu" style={{ top: menu.y, left: menu.x }}>
      <button onClick={() => onMarkTemp(menu.payload)}>Mark as temporary</button>
      <button onClick={() => onMarkImportant(menu.payload)}>Mark as important</button>
    </div>
  );
}
