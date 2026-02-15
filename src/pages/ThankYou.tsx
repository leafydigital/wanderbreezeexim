import React from "react";
import { Link } from "react-router-dom";

const ThankYou = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Thank You!</h1>

        <p style={styles.text}>
          Your enquiry has been submitted successfully.
          <br />
          Our team at Wander Breeze Exim will contact you shortly.
        </p>

        <Link to="/" style={styles.button}>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fa",
  },
  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    maxWidth: "500px",
    width: "90%",
  },
  title: {
    fontSize: "32px",
    marginBottom: "10px",
    color: "#1a73e8",
  },
  text: {
    fontSize: "16px",
    marginBottom: "25px",
    color: "#444",
    lineHeight: "1.6",
  },
  button: {
    display: "inline-block",
    padding: "12px 22px",
    background: "#1a73e8",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default ThankYou;
