import React, {useState, useEffect} from 'react';
import ReactMapGL, {Marker,Popup, Source, Layer} from "react-map-gl";
import ISS from "../src/iss.svg";
import {coordinate} from "../src/coordinates";
import './App.css';

const ISS_LOCATION_API : any = "http://api.open-notify.org/iss-now";
const ISS_ASTROS_INFO_API : any = "http://api.open-notify.org/astros";

let cachedLocation: any = null;
let cachedISSTimestamp: number;

let cachedAstroData: any = null;
let cachedAstroTimestamp: number;

const ms : number = 10*1000;


let data : GeoJSON.Feature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: coordinate,
  }, 
 properties: {},
};


const getAstrosInfo = async (): Promise<any> =>{
    if (cachedAstroTimestamp &&  cachedAstroTimestamp > Date.now() - ms/3) {
      // instead of 'Cache-Control' ie res set('Cache-Control', 'public, max-age=600, s-maxage=1200') 
      console.log("Cached ASTRO data returning !");
      return cachedAstroData;
    }
 
    const api: any = ISS_ASTROS_INFO_API;
    try{
        const response : any = await fetch(api)
          .then(response => response.json())
          .then(json =>{
              cachedAstroData = json;
              cachedAstroTimestamp = Date.now();
              json.cacheTime = cachedAstroTimestamp;
              console.log("updated ASTRO data returning !");
              return json;
          })
          return response;
    }catch(error){
        if(error){
          return error.message;
        }
    }
    
}

const getISSLocation = async (): Promise<any> =>{
  if (cachedISSTimestamp &&  cachedISSTimestamp > Date.now() - ms/4) {
    // instead of 'Cache-Control' ie res set('Cache-Control', 'public, max-age=600, s-maxage=1200') 
    console.log("Cached ISS data returning !");
    return cachedLocation;
  }
  
    const api: any = ISS_LOCATION_API;
    try{
        const response:any = await fetch(api)
        .then(response => response.json())
        .then(json => {

          cachedLocation = json;
          cachedISSTimestamp = Date.now();
          json.cacheTime = cachedISSTimestamp;
          console.log("updated ISS data returning !");
          return json;
      
        });
        return response;
    }catch(error){
        if(error){
            return error.message;
        }
    }
}

  
  function App() {
  const [viewport, setViewport] = useState<any | null>({
      latitude: 37.830348,
      longitude: -122.486052,
      width: "100vw",
      height: "100vh",
      zoom: 2,
  })

  const [issLocation, setIssLocation] = useState<any | null>({
        key: "ISS",
        latitude: 37.830348,
        longitude: -122.486052,
        timestamp: null,
  })

  const [issSelected, setIssSelected] = useState<any | null>(null)

  const [astroData, setAstroData] = useState<any | null>(null)

  const [settings] = useState<any | null>({
    dragPan:false,
    dragRotate: false,
    scrollZoom: false,
    touchZoom: false,
    touchRotate: false,
    keyboard: false,
    doubleClickZoom: false
    });

    const setCurrentAstroData = async () : Promise<void> => {
      const data: any = await getAstrosInfo();
      setAstroData(data);;
  }
 
    const setCurrentIssLocation = (): void =>{
      getISSLocation().then(ISSData =>{
        setIssLocation({
          latitude: Number(ISSData.iss_position.latitude),
          longitude: Number(ISSData.iss_position.longitude),
          timestamp:ISSData.timestamp,
        });
    });
  }

  const setMapLocation = (): void =>{
    getISSLocation().then(ISSData =>{
      console.log(ISSData);
      setViewport({
        latitude: Number(ISSData.iss_position.latitude),
        longitude: Number(ISSData.iss_position.longitude),
        width: "100vw",
        height: "100vh",
        zoom: 2,
      });
  });
}
        useEffect(() => {
          setMapLocation();
          setCurrentIssLocation();
          setCurrentAstroData(); 
        },[]);

        useEffect(() => {
            const interval = setInterval(() => {
              setCurrentIssLocation();
              setMapLocation();
            }, ms/4);
             return () => clearInterval(interval);
        },[]);

  


  return (
      <ReactMapGL
      {...viewport}
      {...settings}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      onViewportChange={viewport => {
        setViewport(viewport);
      }}
    >
      <Marker
            key={issLocation.key}
            latitude={issLocation.latitude}
            longitude={issLocation.longitude}
          >
            <button
              className="marker-btn"
              onClick={e => {
               // e.preventDefault();
                setIssSelected(issLocation)
              }}
            >
              <img src={ISS} alt="International Space Station" />
            </button>
          </Marker>
          {issSelected?
          <Popup
            latitude={issLocation.latitude}
            longitude={issLocation.longitude}
            onClose={() => {
              setIssSelected(null)
            }}
          >
            <div>
              <h2>ISS Astronoute Information</h2>
              <p>ISS Total Crew Member: {astroData.number} </p>
              {
                astroData.people.map((astro:any, i : number) =>(
                <div key={i}>
                  <p>Name: {astro.name}</p>
                  <p>Craft: {astro.craft}</p>
                </div>
              ))
             }
            </div>
          </Popup>: null}
          <Source id='polylineLayer' type='geojson' data={data}>
            <Layer
              id='lineLayer'
              type='line'
              source='my-data'
              layout={{
              'line-join': 'round',
              'line-cap': 'round',
              }}
              paint={{
              'line-color': 'rgba(3, 170, 238, 0.5)',
                'line-width': 5,
              }}
            />
          </Source>
  </ReactMapGL>
  );
}

export default App;
