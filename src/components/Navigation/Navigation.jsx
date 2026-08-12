import "./Navigation.css";
import logo from "../assets/logo.svg";

function Navigation() {
  return (
    <nav className="navigation">
      <div className="navigation__brand">
        <img src={logo} alt="ORO Logo" className="navigation__logo" />
        <span className="navigation__product-name">Home Equity Explorer</span>
      </div>
      <p className="navigation__disclaimer">
        Illustrative estimates · Educational only · Inputs stay on this device
      </p>
    </nav>
  );
}

export default Navigation;
