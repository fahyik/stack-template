export function Spinner(props: { text?: string }) {
  return (
    <div className="flex justify-center items-center space-x-2">
      <div
        className={`w-6 h-6 border-gray-400 border-2 border-t-transparent rounded-full animate-spin`}
      ></div>
      <p className="">{props.text ?? "Loading"} ...</p>
    </div>
  );
}
