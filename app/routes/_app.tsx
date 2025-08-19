import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useNavigate, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { DEFAULT_Onboarding_SETTINGS, ONBOARDING_TOTAL_STEPS } from "app/lib/helpers/onboarding.helper";
import { getOnboardingSettings } from "app/models/onboarding.settings.server";
import { useEffect } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const onboardingSettings = (await getOnboardingSettings(admin.graphql)) ?? DEFAULT_Onboarding_SETTINGS;

  return { apiKey: process.env.SHOPIFY_API_KEY || "", onboardingSettings };
};

export default function App() {
  const { apiKey, onboardingSettings } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnboardingCompleted = onboardingSettings.currentStep == ONBOARDING_TOTAL_STEPS;

  useEffect(() => {
    const isOnboardingRoute = location.pathname.startsWith("/onboarding");
    if (!isOnboardingCompleted && !isOnboardingRoute) {
      navigate("/onboarding", {
        replace: true,
        state: { onboardingSettings: onboardingSettings },
      });
    }
  }, [onboardingSettings, navigate, location.pathname, isOnboardingCompleted]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {isOnboardingCompleted ? (
        <>
          <NavMenu>
            <Link to="/" rel="home">
              Home
            </Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/marketing">Marketing</Link>
            <Link to="/widget">Widget customization</Link>
            <Link to="/email">Email templates</Link>
          </NavMenu>
          <Outlet />
        </>
      ) : (
        <>
          <NavMenu>
            <Link to="/onboarding" state={{ currentStep: onboardingSettings.currentStep }}>
              Onboarding
            </Link>
          </NavMenu>
          {location.pathname.startsWith("/onboarding") && <Outlet />}
        </>
      )}
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
