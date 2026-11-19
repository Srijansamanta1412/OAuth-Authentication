import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-zmou7tv4jmkiset2.us.auth0.com"
      clientId="49XOgIuDs2HKFY6JpsppXf5mY68BoX4E"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "cadd8f74-68d6-47b6-b2f8-29225e4b68ad",
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
