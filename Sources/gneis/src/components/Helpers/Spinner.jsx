import { motion } from "framer-motion";

const CircleSpinner = ({
  width = 40,
  height = 40,
  color = "#364b5f",
  backgroundColor = "rgba(255, 255, 255, 0.6)",
}) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
      backgroundColor,
    }}
  >
    <div>
      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="150"
          strokeDashoffset="75"
        />
      </motion.svg>
    </div>
  </div>
);

export default CircleSpinner;



