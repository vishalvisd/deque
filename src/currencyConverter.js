import React, {useEffect, useState} from "react";
import _ from "lodash";
import TextField from '@mui/material/TextField';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from '@mui/material/Button';
import { useStateCallback } from "use-state-callback";
import CompareArrowsSharpIcon from '@mui/icons-material/CompareArrowsSharp';
import {Validation, fieldValidatorCore} from "react-validation-framework";

const MAX_VALUE_RANGE = 10000;

const currencyValueInputValidation = [
    {
        validator: (val) => {
            if (!val){
                return true;
            } else {
                return new RegExp(/^(\d+)?([.]?\d*)?$/).test(`${val}`);
            }
        },
        errorMessage: "Must be a numberic value"
    },
    {
        validator: (val) => !(parseInt(val) > MAX_VALUE_RANGE),
        errorMessage: `Must be any number less than ${MAX_VALUE_RANGE}`
    }
]

let apiData = null;

export default function CurrencyConverter(){
    const initialCurrencyValueState = [{
        denomination: "USD",
        value: 1
    }, {
        denomination: "INR",
        value: null
    }]
    const [currencyValue, setCurrencyValue] = useStateCallback([...initialCurrencyValueState]);

    const [apiDataLoaded, setApiDataLoaded] = useState(false);

    const fetchData = async()=>{
        setApiDataLoaded(false);
        apiData = await fetch("https://open.er-api.com/v6/latest/USD").then(d => d.json()).then(d=>{
            setApiDataLoaded(true);
            return d;
        }).catch(e => {
            setApiDataLoaded(false);
            return e;
        });
    }

    useEffect(()=>{
        fetchData();
    }, []);

    useEffect(()=>{
        apiDataLoaded && updateCurrencyValue(currencyValue, true);
    }, [apiDataLoaded]);

    const updateCurrencyValue = (currencyValue, isFirstCurrency = true) => {
        const val = currencyValue[isFirstCurrency ? 0 : 1].value
        if (!apiDataLoaded){
            console.log("API Data not loaded");
        }
        const currencyBaseValue = val / apiData.rates[currencyValue[isFirstCurrency ? 0 : 1].denomination];
        currencyValue[isFirstCurrency ? 0 : 1].value = val;
        const convertedValue = _.round(apiData.rates[currencyValue[isFirstCurrency ? 1 : 0].denomination] * currencyBaseValue, 3);
        currencyValue[isFirstCurrency ? 1 : 0].value = _.isNaN(convertedValue) ? 0 : convertedValue;

        setCurrencyValue([...currencyValue], ()=>{});
    }

    const reverseSelection = ()=>{
        setCurrencyValue([..._.reverse(currencyValue)], ()=>{});
    }

    const handleReset = ()=>{
        setCurrencyValue([...initialCurrencyValueState], (currencyValue)=>{
            updateCurrencyValue(currencyValue);
        });
    }

    return <div><div>
        <Validation
            componentTag="TextField"
            validators={currencyValueInputValidation}>
        <TextField
            id="firstCurrencyValue"
            variant="outlined"
            value={currencyValue[0].value}
            onChange={(evt)=>{
                currencyValue[0].value = evt.target.value;
                updateCurrencyValue(currencyValue, true)
            }}
        />
        </Validation>
        <Select
            id="firstCurrency"
            value={currencyValue[0].denomination}
            label="Age"
            onChange={(evt)=>{
                currencyValue[0].denomination = evt.target.value;
                setCurrencyValue([...currencyValue], (currencyValue)=>{
                    updateCurrencyValue(currencyValue);
                })
            }}
        >
            {_.map(_.filter(_.keys(_.get(apiData, "rates", [])), (v)=> v !== currencyValue[1].denomination), (d)=>{
                return <MenuItem key={d} value={d}>{d}</MenuItem>
            })}
        </Select>

        <CompareArrowsSharpIcon onClick={reverseSelection}/>

        <Select
            id="secondCurrency"
            value={currencyValue[1].denomination}
            onChange={(evt)=>{
                currencyValue[1].denomination = evt.target.value;
                setCurrencyValue([...currencyValue], (currencyValue)=>{
                    updateCurrencyValue(currencyValue);
                })
            }}
        >
            {_.map(_.filter(_.keys(_.get(apiData, "rates", [])), (v)=> v !== currencyValue[0].denomination), (d)=>{
                return <MenuItem key={d} value={d}>{d}</MenuItem>
            })}
        </Select>

        <Validation
            componentTag="TextField"
            validators={currencyValueInputValidation}>
            <TextField
                id="secondCurrencyValue"
                variant="outlined"
                value={currencyValue[1].value}
                onChange={(evt)=>{
                    currencyValue[1].value = evt.target.value;
                    updateCurrencyValue(currencyValue, false)
                }}
            />
        </Validation>



    </div>
        <Button variant="contained" onClick={()=>{
            handleReset();
        }}>Reset</Button>
    </div>
}
