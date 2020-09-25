import React from "react";
import UI from "./components/Layout/UI";
import { Provider } from "react-redux";
import "./styles/App.css";

function App(props) {
    return (
        <Provider store={props.store}>
            <UI />
        </Provider>
    );
}

export default App;
