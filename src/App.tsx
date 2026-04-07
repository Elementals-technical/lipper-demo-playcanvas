import { useEffect } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "./store/store";
import { router } from "./router/router";
import { initProductAttributes, getMockAttributes } from "./configurator";
import { setAttributes, setApiReady } from "./store/slices/configurator/Configurator.sclice";
import type { AttributeState } from "./store/slices/configurator/type";

function buildInitialAttributes(): Record<string, AttributeState> {
  const mocks = getMockAttributes();
  const result: Record<string, AttributeState> = {};

  for (const [name, attr] of Object.entries(mocks)) {
    if (!attr?.values?.length) continue;

    const isBoolean = attr.type === "Boolean";
    const currentValue = isBoolean
      ? attr.value
      : (attr.value as { assetId: string }).assetId;

    const selected = attr.values.find((v) =>
      isBoolean ? v.value === currentValue : v.assetId === currentValue,
    ) ?? attr.values[0];

    result[name] = {
      activeItem: selected.label,
      defaultItem: selected.label,
      img: selected.metadata._img ?? "",
    };
  }

  return result;
}

const AppInit = () => {
  useEffect(() => {
    initProductAttributes().then(() => {
      const attrs = buildInitialAttributes();
      store.dispatch(setAttributes(attrs));
      store.dispatch(setApiReady(true));
    });
  }, []);

  return <RouterProvider router={router} />;
};

const App = () => {
  return (
    <Provider store={store}>
      <AppInit />
    </Provider>
  );
};

export default App;
