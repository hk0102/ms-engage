/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import axios from "axios";
import DetectFace from "./DetectFace";
import DetectFace2 from "./DetectFace2";
import Posts from "./Posts";

const Dashboard = () => {
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    refreshToken();
    getUsers();
  }, []);

  const refreshToken = async () => {
    try {
      const response = await axios.get("http://localhost:4000/token");
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      setName(decoded.name);
      setExpire(decoded.exp);
    } catch (error) {
      if (error.response) {
        // history.push("/");
      }
    }
  };

  const axiosJWT = axios.create();

  // axiosJWT.interceptors.request.use(
  //   async (config) => {
  //     const currentDate = new Date();
  //     if (expire * 1000 < currentDate.getTime()) {
  //       const response = await axios.get("http://localhost:4000/token");
  //       config.headers.Authorization = `Bearer ${response.data.accessToken}`;
  //       setToken(response.data.accessToken);
  //       const decoded = jwt_decode(response.data.accessToken);
  //       setName(decoded.name);
  //       setExpire(decoded.exp);
  //     }
  //     return config;
  //   },
  //   (error) => {
  //     return Promise.reject(error);
  //   }
  // );

  const getUsers = async () => {
    const response = await axiosJWT.get("http://localhost:4000/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUsers(response.data);
  };

  return (
    <>
      <h1>Welcome Back!</h1>
      {/* <DetectFace2></DetectFace2> */}
      <Posts></Posts>
    </>
  );
};

export default Dashboard;
