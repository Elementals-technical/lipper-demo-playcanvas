import { useThreekitInitStatus } from "@threekit-tools/treble/dist";
import { useEffect, useState } from "react";
import { usePhotoGallery } from "../../hooks/usePhotoThreekit";
import { useFilteredConfig, waitThreekitConfiguratorReady } from "../../hooks/useFilteredConfig";
import { ThreekitItemCamera } from "../../services/ThreekitItemCamera";
import { ListSlider } from "./ListSlider/ListSlider";
import { getIftameConfigurator } from "../../utils/threekit/iframeConfigurator";
import { filteredConfigurationBySkipAttr } from "../../utils/threekit/threekitUtils";

const getThreekitSliderCameras = async (): Promise<number[]> => {
  await waitThreekitConfiguratorReady({
    predicate: async () => {
      return window.threekit.configurator.getMetadata() !== undefined;
    },
  });

  const threekitItemCamera = await new ThreekitItemCamera(
    // @ts-ignore
    window.threekit.configurator.getMetadata()
  );

  // Generate Threekit camera views
  const cameraNumbers = await threekitItemCamera.getSliderCameras();

  return cameraNumbers.slice(0, 4);
};

export const PhotoSlider = (/*{ onSelectImage }*/) => {
  const isLoadDefaultConfiguration = useThreekitInitStatus();
  // const hubspotImagesFromStore = useStoreSelector(getHubspotProductImages);
  // const [threekitImages, setThreekitImages] = useState([]);
  const [galleryReady, setGalleryReady] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [dialogOpen, setDialogOpen] = useState(false);

  const product = window.threekit.player.assetId;

  const [cameras, setCameras] = useState<number[]>([]);

  const filteredConfig = useFilteredConfig();

  useEffect(() => {
    (async () => {
      const sliderCam = await getThreekitSliderCameras();
      // const sliderCam = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

      console.log("sliderCam --- ==== ", sliderCam);

      setCameras(sliderCam);
    })();
  }, []);

  console.log("getIftameConfigurator()?.getConfiguration() --- ==== ", getIftameConfigurator()?.getConfiguration());
  console.log(
    "window.threekit.configurator.getConfiguration() --- ==== ",
    window.threekit.configurator.getConfiguration()
  );

  const filteredConfiguration =
    getIftameConfigurator()?.getConfiguration() ?? window.threekit.configurator.getConfiguration();

  console.log("filteredConfiguration --- ==== ", filteredConfiguration);
  console.log(
    "filteredConfigurationBySkipAttr(filteredConfiguration) --- ==== ",
    filteredConfigurationBySkipAttr(filteredConfiguration)
  );

  const { threekitImages } = usePhotoGallery({
    configuration: filteredConfigurationBySkipAttr(filteredConfiguration),
    cameras,
    // preload: true,
  });
  console.log("threekitImages --- ==== ", threekitImages);

  // Single effect to handle everything: Threekit generation, HubSpot fetch, and preloading
  // useEffect(() => {
  //   const initializeGallery = async () => {
  //     setGalleryReady(false);

  //     try {
  //       // 1. Wait for Threekit to be ready and generate images
  //       const threekitPromise = new Promise((resolve) => {
  //         const checkThreekitImages = () => {
  //           if (threekitImages && threekitImages.length > 0) {
  //             resolve(threekitImages);
  //           } else {
  //             setTimeout(checkThreekitImages, 100);
  //           }
  //         };
  //         checkThreekitImages();
  //       });
  //       // 2. Get HubSpot images - use Redux store (already loaded by useHubspotProductData)
  //       const hubspotPromise = Promise.resolve(hubspotImagesFromStore || []);

  //       // 3. Wait for threekitImages to be ready

  //       // 4. Wait for both to complete
  //       const [threekitResults, hubspotResults] = await Promise.all([threekitPromise, hubspotPromise]);

  //       // 5. Process and combine images
  //       const processedHubspotImages = hubspotResults.map((image, index) => ({
  //         url: image.url,
  //         camera: `hubspot-${index}`,
  //         source: "hubspot",
  //         id: image.id,
  //       }));
  //       console.log("threekitImages", threekitResults);

  //       const allImages = [...threekitResults, ...processedHubspotImages];

  //       if (allImages.length === 0) {
  //         setGalleryReady(true);
  //         return;
  //       }

  //       // 5. Preload all images
  //       console.log(`Preloading ${allImages.length} images...`);
  //       const preloadPromises = allImages.map((image) => {
  //         return new Promise((resolve) => {
  //           const img = new Image();
  //           img.onload = () => resolve();
  //           img.onerror = () => resolve(); // Continue even if image fails
  //           img.src = image.url;
  //         });
  //       });

  //       await Promise.all(preloadPromises);
  //       console.log("All images preloaded successfully");

  //       // 6. Gallery is ready
  //       setGalleryReady(true);
  //     } catch (error) {
  //       console.error("Error initializing gallery:", error);
  //       setGalleryReady(true); // Show gallery even if there are errors
  //     }
  //   };

  //   initializeGallery();
  // }, [product, isLoadDefaultConfiguration, threekitImages]);

  // Process Hubspot images for display
  // const processedHubspotImages = hubspotImagesFromStore.map((image, index) => ({
  //   url: image.url,
  //   camera: `hubspot-${index}`,
  //   source: "hubspot",
  //   id: image.id,
  // }));

  // Combine images for the slider
  // const combinedImages = [...threekitImages, ...processedHubspotImages];

  // Add keyboard navigation for dialog
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     if (!dialogOpen) return;
  //     switch (e.key) {
  //       case "ArrowRight":
  //         handleNextImage();
  //         break;
  //       case "ArrowLeft":
  //         handlePrevImage();
  //         break;
  //       case "Escape":
  //         setDialogOpen(false);
  //         break;
  //       default:
  //         break;
  //     }
  //   };
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, [dialogOpen]);

  // Handler for opening the dialog (lightbox)
  // const handleOpenLightbox = (index) => {
  //   const threekitLength = threekitImages.length;
  //   const hubspotIndex = index - threekitLength;
  //   if (hubspotIndex < 0 || hubspotIndex >= processedHubspotImages.length) {
  //     return;
  //   }
  //   setCurrentImageIndex(hubspotIndex);
  //   setDialogOpen(true);
  // };

  const onSelectImage = () => {
    console.log("onSelectImage --- ==== ");
  };

  return (
    <div className="w-full">
      {
        /*galleryReady && */ threekitImages.length > 0 ? (
          <>
            <ListSlider
              listAttribute={threekitImages}
              onSelectImage={onSelectImage}
              // onOpenLightbox={(index) => {
              //   const threekitLength = threekitImages.length;
              //   if (index >= threekitLength) {
              //     handleOpenLightbox(index);
              //   }
              // }}
            />
          </>
        ) : (
          <>{/* <Skeleton className="h-[9rem] md:h-[12rem] w-full" /> */}</>
        )
      }
    </div>
  );
};
