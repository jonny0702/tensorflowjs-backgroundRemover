import React, {
  useState,
  useEffect,
  useRef
} from "react";
import * as tf from "@tensorflow/tfjs";
import * as deeplab from "@tensorflow-models/deeplab";
import "@tensorflow/tfjs-backend-webgl";

import styles from "./styles/App.module.sass";

export const App: React.FC = () => {
  //REFS
  const modelSelectRef = useRef<HTMLSelectElement>(null);
  const generatedImage = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<any>();
  let ctx = useRef<CanvasRenderingContext2D | null>(null);
  const canvas2 = useRef<any>()
  let ctx2 = useRef<CanvasRenderingContext2D | null>(null);

  //STATES
  const [model, setModel] = useState<React.SetStateAction<any>>();
  const [modelNameSelection, setModelName] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState(true);
  const [image, setImage] = useState<React.SetStateAction<string>>();
  const [legend, setLegend] = useState<any>({})
  const [predictionImg , setPredictionImg] =  useState<any>({})
  const [disableButton, setDisableButton] = useState(true);
  const [downloadEnable, setDownloadEnable] = useState(true)
  let objectColors: any = {}
 

  const handleLoadModel = () => {
    setDisableButton(true);
    const modelName = `${
      modelSelectRef.current?.options[modelSelectRef.current.selectedIndex]
        .value
    }`;
    setModelName(modelName.toLocaleLowerCase());
  };

  const handleUploadImage = (e: any) => {
    const [file] = e.target.files;

    if (file) {
      const converterToURL = URL.createObjectURL(file);
      setImage(converterToURL);
      setDisableButton(false);
    }
  };
  const predict = async () => {
    let prediction = await model.segment(generatedImage.current);
    // console.log(prediction);
    setPredictionImg(prediction)
    renderPredictionImage(prediction);
  };

  const loadModel = async (modelNameSelection: any) => {
    try {
      const modelLoaded = await deeplab.load({
        base: modelNameSelection,
        quantizationBytes: 2,
      });
      setModel(modelLoaded);
      setDisableButton(false);
      setLoadStatus(false);
      console.log("Model Loaded :D");
    } catch (error) {
      console.error(error, "ERROR TO LOAD MODEL");
    }
  };

  const renderPredictionImage = (prediction: any) => {
    const { legend, height, width, segmentationMap } = prediction;

    console.log("Prediction: " + JSON.stringify(legend));

    const segmentationMapData = new ImageData(segmentationMap, width, height);
    canvasRef.current.width = generatedImage.current?.width;
    canvasRef.current.height = generatedImage.current?.height;

    //Render CTX Canvas using the prediction parameters
    ctx.current?.putImageData(segmentationMapData, 0, 0);
    setLegend(legend)
  };

 const arrLegend = Object.keys(legend)

 const storeObjectColor = (e: React.MouseEvent<HTMLSpanElement>)=>{
  // console.log(e.target)
  const target = e.target as HTMLElement
    //get the legend name from the text of the span element
  let objectName = target.innerText;
  //get the legend color from the background color of the span element
  let objColor: any = window.getComputedStyle(target).backgroundColor;
  //Convert the color to an array we delete the rgb() string and split push all the string in the array
  //and with map we convert all strings into number type
  objColor = objColor.replace('rgb(', '').replace(')','').split(',').map(Number)
  console.log(objColor)
  objectColors[objectName] = objColor;

  target.style.border = "5px solid green"
 }

 const removeOrRestoreSelectedObjects = (e: React.MouseEvent<HTMLButtonElement>)=>{
    let target = e.target as HTMLElement

    const alphaValueToSet = (target.id == 'removeSelectedObjects') ? 0 : 255;
    
    const {legend, height, width, segmentationMap} = predictionImg

    canvas2.current.width = width
    canvas2.current.height = height
    if(generatedImage.current){
      ctx2.current?.drawImage(generatedImage.current, 0, 0,width, height)
    }
   //Get the imageData object to get pixel wise information (rgba) of the source image displayed in the canvas
    const imageData = ctx2.current?.getImageData(0,0,width, height)

    //Loop through the segmentationMap object to get the rgba data for every pixel.
    //Using this rgba information, we will match it against the rgb information of the selected object,
    //to set the corresponding pixel's alpha value to 0 to make it invisible (transparent).
    for(let i=0; i < segmentationMap.length; i+= 4){
      //Loop through each object to remove
      Object.keys(objectColors).forEach((objColor)=>{
        //Get the RGB color (represented in 1D Array with 3 elements)
        //to match against the RGB color data from segmentation map.
        let color = objectColors[objColor];
        //Check if the pixels RGB color matches with the objects RGB color
        if(segmentationMap[i] == color[0]
            && segmentationMap[i + 1] == color[1]
            && segmentationMap[i + 2] == color[2]
          ){
            //Set the alpha value of the pixel to 0
           if(imageData?.data) imageData.data[i + 3] = alphaValueToSet
        }
      })
    }
    //Display the processed Image data on canvas
    if(imageData) ctx2.current?.putImageData(imageData, 0 , 0);
    setDownloadEnable(false)
 }

 const handleDownload = () =>{
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.href = canvas2.current.toDataURL();
  a.download = 'canvas-image.png'
  a.click()
  document.body.removeChild(a);
 }

  useEffect(() => {
    modelNameSelection && loadModel(modelNameSelection);
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext("2d");
    }
    if(canvas2.current){
      ctx2.current = canvas2.current.getContext('2d')
    }
  }, [modelNameSelection]);


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
        >
          Load Model
        </button>
        <p>{loadStatus ? "Model not Loaded..." : "Model Loaded :D"}</p>
      </div>
      <div>
        <input
          type="file"
          id="chooseFiles"
          accept="image/*"
          onChange={(e) => handleUploadImage(e)}
        />
        <button id="segmentImage" disabled={disableButton} onClick={predict}>
          Segment Image
        </button>
      </div>

      <img
        id="image"
        width="500"
        height="auto"
        crossOrigin={"anonymous"}
        src={`${image}`}
        ref={generatedImage}
      />

      <canvas id="canvas" ref={canvasRef}></canvas>

      <p id="legendLabel">Legend</p>
      <div id="legends" >
        {
          arrLegend.map((item)=>{
            const [red, green,blue] = legend[item]
             return (
              <span
                key={item}
                onClick={(e)=> storeObjectColor(e)}
                style={{
                  backgroundColor: `rgb(${red}, ${green}, ${blue})`,
                  padding: '10px',
                  marginRight: '10px',
                  marginBottom: '10px',
                  color: '#ffffff'
                }}
              >
                  {item}
              </span>
             )
          })
        }
      </div>
      <div>
        <button id="removeSelectedObjects" onClick={(e)=> removeOrRestoreSelectedObjects(e)}>Remove Selected Objects</button>
        <button id='restoreSelectedObjects' onClick={(e)=> removeOrRestoreSelectedObjects(e)}>Restore Selected Objects</button>
      </div>
      <canvas ref={canvas2}></canvas>
      <button onClick={handleDownload} disabled={downloadEnable}>Download Converted Image</button>
    </div>
  );
};
