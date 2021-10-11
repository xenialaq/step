import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
} from 'react-native';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import _ from 'lodash';

const { manifest } = Constants;

const baseUri = `http://${((manifest || {}).debuggerHost || 'localhost:3000').split(':').shift()}:3000`;

interface IGetCodeResponse {
  data: {
    balance: number
    code: number
  }
}

interface IGetUserResponse {
  data: {
    balance: number
    code: number
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2: {
    fontSize: 32,
  },
  h3: {
    fontSize: 26,
  },
  h4: {
    fontSize: 22,
  },
  h5: {
    fontSize: 20,
  },
  section: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  redText: {
    color: 'red',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    marginVertical: 10,
  },
});

export default function App() {
  const [code, setCode] = useState(-1);
  const [balance, setBalance] = useState(0);
  const [errorText, setErrorText] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [codeExpr, setCodeExpr] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [timerRefresh, setTimerRefresh] = useState();

  useEffect(() => {
    const t = setInterval(() => {
      if (codeExpr > 0) {
        setCodeExpr(codeExpr - 1);
      }
    }, 1e3);
    setTimerRefresh(t);
    return () => {
      clearInterval(timerRefresh);
    };
  }, [codeExpr]);

  const withdraw = async (amount: number) => {
    if (amount <= 0 || codeExpr > 0) {
      return;
    }
    const endpoint = `${baseUri}/getCode`;
    setErrorText('');
    try {
      const { data }: IGetCodeResponse = await Promise.race([
        axios.post(endpoint, { amount }),
        new Promise<any>((r, rj) => setTimeout(
          () => rj(new Error('Timeout')),
          1e4,
        )),
      ]);
      setErrorText('');
      setBalance(data.balance);
      setCode(data.code);
      setWithdrawing(false);
      setCodeExpr(10);
    } catch (err: any) {
      let errorTxt = 'Unknown server error';
      if (err.message === 'Timeout') {
        errorTxt = 'Server timeout';
      } else if (err.response) {
        errorTxt = err.response.data.error || errorTxt;
      }
      setErrorText(errorTxt);
      setWithdrawing(false);
      setCodeExpr(10);
    }
  };

  useEffect(() => {
    if (withdrawing && withdrawAmount) {
      withdraw(withdrawAmount);
    }
  }, [withdrawing, withdrawAmount]);

  const getUser = async () => {
    const endpoint = `${baseUri}/getUser`;
    setErrorText('');

    try {
      const { data }: IGetUserResponse = await Promise.race([
        axios.get(endpoint),
        new Promise<any>((r, rj) => setTimeout(
          () => rj(new Error('Timeout')),
          1e4,
        )),
      ]);
      setErrorText('');
      setCode(data.code);
      setBalance(data.balance);
    } catch (err: any) {
      let errorTxt = 'Unknown server error';
      if (err.message === 'Timeout') {
        errorTxt = 'Server timeout';
      } else if (err.response) {
        errorTxt = err.response.data.error || errorTxt;
      }
      setErrorText(errorTxt);
    }
  };

  useEffect(() => {
    getUser();
    return () => { };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.h2}>Code {code}</Text>
        <Text style={styles.h2}>Balance ${balance}</Text>
      </View>
      <View style={styles.section}>
        <TouchableOpacity
          disabled={codeExpr > 0 || withdrawing}
          style={{ ...styles.button, width: '80%', backgroundColor: (codeExpr > 0 || withdrawing) ? '#FFF' : styles.button.backgroundColor }}
          onPress={withdrawing ? _.nop : () => {
            setWithdrawAmount(10); setWithdrawing(true);
          }}
        >
          <Text>Withdraw $10</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={codeExpr > 0 || withdrawing}
          style={{ ...styles.button, width: '80%', backgroundColor: (codeExpr > 0 || withdrawing) ? '#FFF' : styles.button.backgroundColor }}
          onPress={withdrawing ? _.nop : () => {
            setWithdrawAmount(100); setWithdrawing(true);
          }}
        >
          <Text>Withdraw $100</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={{ ...styles.h4, ...styles.redText }}>{errorText}</Text>
        <Text style={styles.h3}>{withdrawing ? 'Please wait...' : ''}</Text>
        <Text style={styles.h2}>{codeExpr > 0 ? codeExpr : ''}</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
