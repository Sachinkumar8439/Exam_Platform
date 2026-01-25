import "./loader.css";

const Loader = ({ size = 48 }) => {
  return (
    <div
      className="loader"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
};

export default Loader;
