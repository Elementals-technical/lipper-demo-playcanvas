import React, { useRef, useState, useEffect, useMemo } from "react";
import s from "./../PhotoSlider.module.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ThreekitItemCamera } from "../../../services/ThreekitItemCamera";
import { getIftameStageConfigurator } from "../../../utils/threekit/iframeStageConfigurator";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { getConfiguratorView, getStageCamera } from "../../../store/slices/configurator/selectors/selectors";
import { changeСonfiguratorView, setStageCamera } from "../../../store/slices/configurator/Configurator.sclice";
import { getIftameConfigurator } from "../../../utils/threekit/iframeConfigurator";
import { IThreekitConfigurator } from "@threekit-tools/treble/dist/types";
import { filteredConfigurationBySkipAttr } from "../../../utils/threekit/threekitUtils";

interface ImageData {
  url: string;
  camera: number | string;
  source?: string;
  id?: string;
  configuration?: any;
}

interface ListSliderProps {
  listAttribute: ImageData[];
  onSelectImage?: (image: ImageData) => void;
  onOpenLightbox?: (index: number) => void;
}

export const ListSlider: React.FC<ListSliderProps> = ({ listAttribute, onSelectImage, onOpenLightbox }) => {
  // let stageCamera = useStoreSelector(getStageCamera);
  const swiperRef = useRef<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const configuratorView = useAppSelector(getConfiguratorView);
  const currentStageCamera = useAppSelector(getStageCamera);
  const dispatch = useAppDispatch();
  // const confStageIframe = await window.iframePlayer.current.contentWindow.player.getStageConfigurator()

  // const zoomActive = useStoreSelector(getZoomActive);

  // const dispatch = useStoreDispatch();

  // Set initial active zoom photo when images are loaded
  // useEffect(() => {
  //   if (listAttribute.length > 0) {
  //     const firstImage = listAttribute[0];
  //     if (firstImage) {
  //       // Set the first image as active zoom photo for initial state
  //       dispatch(
  //         setActiveZoomPhoto({
  //           value: firstImage.camera,
  //           source: firstImage.source || "threekit",
  //           index: 0,
  //           url: firstImage.url,
  //         })
  //       );
  //     }
  //   }
  // }, [listAttribute, dispatch]);

  // Update selectedIndex when stageCamera changes (including when DimensionIcon is clicked)
  // useEffect(() => {
  //   // @ts-ignore
  //   if (listAttribute.length > 0 && window.threekit.configurator.getMetadata) {
  //     // @ts-ignore
  //     const threekitItemCamera = new ThreekitItemCamera(window.threekit.configurator.getMetadata());
  //     const dimensionCameraValue = threekitItemCamera.getDimensionCameraValue();

  //     if (dimensionCameraValue && stageCamera === dimensionCameraValue) {
  //       // Find dimension camera number
  //       const matchingIndex = listAttribute.findIndex(
  //         (item) => item.source === "threekit" && item.camera === `${dimensionCameraValue}`
  //       );
  //       debugger;

  //       if (matchingIndex !== -1) {
  //         setSelectedIndex(matchingIndex);
  //         // Also update active zoom photo when dimension camera changes
  //         const matchingImage = listAttribute[matchingIndex];
  //         dispatch(
  //           setActiveZoomPhoto({
  //             value: matchingImage.camera,
  //             source: matchingImage.source || "threekit",
  //             index: matchingIndex,
  //             url: matchingImage.url,
  //           })
  //         );
  //       }
  //     }
  //   }
  // }, [stageCamera, listAttribute, dispatch]);

  const onSelectCamera = (
    value: number | string,
    source: string,
    index: number,
    url: string,
    configuration: any | undefined
  ) => {
    console.log("Image clicked: ====", { value, source, index, url, configuration });

    if (configuratorView === "3D") dispatch(changeСonfiguratorView("2D"));

    // Set the selected index for active state
    setSelectedIndex(index);

    const iframeStageConfigurator = getIftameStageConfigurator();
    iframeStageConfigurator?.setConfiguration({
      Camera: value,
    });
    if (configuration) {
      const iframeConfigurator = getIftameConfigurator();
      iframeConfigurator?.setConfiguration(configuration);
    }
    // if (configuration) {
    //   window.threekit.configurator.setConfiguration(configuration);
    // }
    dispatch(setStageCamera(Number(value)));

    // dispatch(setActiveZoomPhoto({ value, source, index, url }));
    // // Only dispatch camera change for Threekit images (numeric cameras)
    // if (source !== "hubspot") {
    //   dispatch(setStageCamera(value));
    //   // if (onSelectImage && index < listAttribute.length) {
    //   //   onSelectImage(listAttribute[index]);
    //   // }
    // } else if (source === "hubspot" && onOpenLightbox && !zoomActive) {
    //   // Open lightbox for Hubspot images
    //   console.log("Opening lightbox for Hubspot image at index:", index);
    //   onOpenLightbox(index);
    // }
  };

  const iframeConfigurator: IThreekitConfigurator | undefined = useMemo(() => {
    return getIftameConfigurator();
  }, []);

  return (
    <div className={s.sliderContainer}>
      <Swiper
        ref={swiperRef}
        modules={[Navigation]}
        spaceBetween={12}
        slidesPerView={4.7}
        // breakpoints={{
        //   992: {
        //     slidesPerView: 4.7,
        //     spaceBetween: 12,
        //   },
        // }}
        navigation
        className={s.swiperContainer}
        key={`swiper-${listAttribute.length}`}
        observer={true}
        observeParents={true}
      >
        {listAttribute.map((data, index) => {
          const url = data.url;
          const camera = data.camera;
          const source = data.source || "threekit";

          // Determine if this is a Threekit or HubSpot image
          const isThreekit = source === "threekit";

          // Set active class based on selected index
          let classWrap = `${s.wrap}`;
          // if (String(currentStageCamera) === String(data.camera) && selectedIndex === index) {
          //   classWrap += ` ${s.active}`;
          // }
          const currentKey = `Camera_${currentStageCamera}-${JSON.stringify(filteredConfigurationBySkipAttr(iframeConfigurator?.getConfiguration?.() || {}))}`;
          const itemKey = `Camera_${camera}-${JSON.stringify(data.configuration)}`;
          if (currentKey === itemKey) {
            classWrap += ` ${s.active}`;
          }

          return (
            <SwiperSlide key={url}>
              <div
                className={`${classWrap} ${!isThreekit ? s.hubImg : ""}`}
                onClick={() => onSelectCamera(camera, source, index, url, data.configuration)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectCamera(camera, source, index, url, data.configuration);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={isThreekit ? `Camera view ${camera}` : "View in lightbox"}
                data-source={source}
                data-index={index}
              >
                <img
                  src={url}
                  alt={isThreekit ? `Camera ${camera}` : "Additional product image"}
                  className={s.thumbnail}
                  loading="lazy"
                />
                {!isThreekit && <div className={s.lightboxIcon}>+</div>}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};
