import Specimen from "./components/Specimen";
import ContractBar from "./components/ContractBar";
import NervousSystemSection from "./components/NervousSystemSection";
import ChainToOrganismSection from "./components/ChainToOrganismSection";
import StimulusScaleSection from "./components/StimulusScaleSection";
import LiveScopeSection from "./components/LiveScopeSection";
import TheColony from "./components/TheColony";
import ThePlanSection from "./components/ThePlanSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Specimen />
      <ContractBar />
      <LiveScopeSection />
      <TheColony />
      <NervousSystemSection />
      <ChainToOrganismSection />
      <StimulusScaleSection />
      <ThePlanSection />
      <Footer />
    </>
  );
}
