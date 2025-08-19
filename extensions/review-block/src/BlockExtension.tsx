import { reactExtension, useApi, AdminBlock } from "@shopify/ui-extensions-react/admin";
import ReviewBlock from "./ReviewBlock";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n and data.
  const { i18n, data } = useApi(TARGET);
  console.log({ i18n });

  return (
    // The AdminBlock component provides an API for setting the title of the Block extension wrapper.
    <AdminBlock title="Review Block">
      <ReviewBlock productId={data.selected[0]?.id} />
    </AdminBlock>
  );
}
