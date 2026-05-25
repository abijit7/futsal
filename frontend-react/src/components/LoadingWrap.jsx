export default function LoadingWrap({ message }) {
  return (
    <div className="loading-wrap">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

