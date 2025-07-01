interface ButtonDividerProps {
  text?: string;
  className?: string;
}

export function ButtonDivider({ text = "or", className = "" }: ButtonDividerProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex-1 border-t border-gray-300"></div>
      <span className="px-3 text-gray-500 text-sm">{text}</span>
      <div className="flex-1 border-t border-gray-300"></div>
    </div>
  );
}

export default ButtonDivider;
