import { Unplug } from "lucide-react";
import { Spinner } from "./components/ui/shadcn-io/spinner";
import type { LoadState } from "./types/types";

const Loader = ({ loading }: { loading: LoadState }) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-gray-600">
      {loading === "serverloading" && (
        <>
          <Spinner size={80} variant="ring" className="mb-8" />
          <p className="text-gray-500">Waiting for Render server to respond</p>
        </>
      )}
      {loading === "serverfail" && (
        <>
          <Unplug size={80} className="mb-8" />
          <p className="text-gray-500">
            Render servers took too long to response. Please, refresh the page
          </p>
        </>
      )}
    </div>
  );
};

export default Loader;
