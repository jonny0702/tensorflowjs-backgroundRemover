import React, { useState, useEffect, useRef, SetStateAction } from "react";
import * as tf from "@tensorflow/tfjs";
import * as deeplab from "@tensorflow-models/deeplab";
import '@tensorflow/tfjs-backend-webgl';


import styles from "./styles/App.module.sass";

export const App = () => {
  const modelSelectRef = useRef<HTMLSelectElement>(null);
  const [model, setModel] = useState<React.SetStateAction<any>>()
  const [modelNameSelection, setModelName] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState(true)
  const [disableButton, setDisableButton] = useState(false);
  const [image, setImage] = useState<React.SetStateAction<string>>()

  const handleLoadModel = () => {
    setDisableButton(true);
    const modelName = `${
      modelSelectRef.current?.options[modelSelectRef.current.selectedIndex]
        .value
    }`;
    setModelName(modelName.toLocaleLowerCase());
  };

  const handleUploadImage = (e: any) =>{
    const [file]  = e.target.files

    if(file){
      const converterToURL = URL.createObjectURL(file)
      setImage(converterToURL)
    }
    
  }
  const loadModel = async (modelNameSelection: any) => {
    try {
      const modelLoaded = await deeplab.load({ "base": modelNameSelection, "quantizationBytes": 2 });

      console.log("Model Loaded :D");
      setModel(modelLoaded)
      setDisableButton(false);
      setLoadStatus(false)
    } catch (error) {
      console.error(error, 'ERROR TO LOAD MODEL')
    }

  };

  useEffect(() => {
    modelNameSelection && loadModel(modelNameSelection)
  }, [modelNameSelection]);

  console.log(model);

  return (
    <div className={styles.App}>
      <h2>Deep lab Semantic Image Segmentation</h2>
      <div>
        <select name="ModelNameSelect" ref={modelSelectRef}>
          <option>pascal</option>
          <option>cityscapes</option>
          <option>ADE20K</option>
        </select>
        <button
          id="loadModel"
          onClick={handleLoadModel}
          disabled={disableButton}
        >
          Load Model
        </button>
        <p>{loadStatus ? 'Model not Loaded...' : 'Model Loaded :D' }</p>
      </div>
      <div>
        <input type="file" id="chooseFiles" accept="image/*"  onChange={(e) => handleUploadImage(e)}/>
        <button id="segmentImage" disabled>
          Segment Image
        </button>
      </div>

      <img id="image" width="500" height="auto" crossOrigin={"anonymous"} src={`${image}`} />

      <canvas id="canvas"></canvas>

      <p id="legendLabel">Legend</p>
      <div id="legends"></div>
    </div>
  );
};
