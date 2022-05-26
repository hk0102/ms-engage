/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import dotenv from "dotenv";

import jwt_decode from "jwt-decode";
import axios from "axios";
import DetectFace2 from "./DetectFace2";
import Posts from "./Posts";

const Dashboard = () => {
  const [user, setUser] = useState({});
  const [faceRecognised, setFaceRecognised] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const token = localStorage.getItem("token") || "";
    console.log("token", token);
    const headers = {
      authorization: `Bearer ${token}`,
    };
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/user`;
    const { data } = await axios.get(url, {
      headers,
    });

    console.log("-", data);

    setUser(data[0]);
  };

  return (
    <>
      <div className="site-card-wrapper">
        {user && user.role == "ADMIN" ? (
          <>
            <DetectFace2
              detectSignedInUser={false}
              setFaceRecognised={setFaceRecognised}
            ></DetectFace2>
          </>
        ) : null}
        <Posts></Posts>
      </div>
    </>
  );
};

export default Dashboard;
