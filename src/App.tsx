import { ThreekitProvider, Player, PortalToElement, FlatForm, TrebleApp } from "@threekit-tools/treble";
import { Header } from "./components/Header/Header";
import { THREEKIT_PARAMS } from "./config/threekit/threekitConfig";
import { Provider } from "react-redux";
import { store } from "./store/store";

const App = () => {
  return (
    <Provider store={store}>
      <TrebleApp threekitEnv={THREEKIT_PARAMS.THREEKIT_ENV} />
    </Provider>

    // <ThreekitProvider>
    //   <Header />
    //   <div className="tk-treble-player">
    //     <Player />
    //   </div>
    //   <PortalToElement to="tk-treble-form" strict={true}>
    //     <FlatForm />
    //   </PortalToElement>
    // </ThreekitProvider>
  );
};

export default App;
