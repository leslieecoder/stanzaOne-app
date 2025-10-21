interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
}

export default function SuccessMessage({ message, onClose }: SuccessMessageProps) {
  return (
    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg animate-pulse flex justify-between items-center">
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-green-600 hover:text-green-800 font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}
