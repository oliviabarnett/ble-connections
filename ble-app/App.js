import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  Picker,
  Button,
  View
} from "react-native";
import { BleManager, Device, BleError, LogLevel } from "react-native-ble-plx";
import { createStore, combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import base64 from 'react-native-base64'

const rootReducer = combineReducers({
  form: formReducer,
});
const store = createStore(rootReducer);

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.manager = new BleManager();
    this.state = {
      isLoading: true,
      chosenNetwork : '',
      networks : '',
      input : '',
    }
  }

  componentWillMount() {
    console.log("mounted");
    const subscription = this.manager.onStateChange((state) => {
      if (state ==='PoweredOn') {
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  sendCredentials() {
    ssid = base64.encode(this.state.chosenNetwork);
    pass = base64.encode(this.state.input);
    console.log("Writing: ")
    console.log(base64.decode(ssid))
    console.log(base64.decode(pass))
    // Write to SSID characteristic
    this.state.device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', '1448ef56-f2dc-4593-9f17-32cd59fb7774', ssid);
    // Write to PASS characteristic
    this.state.device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', '8204321F-D4bE-4556-9537-2EADB108D28E', pass);
  }

  scanAndConnect() {
    console.log("Started scanning...");
    this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
            // Handle error (scanning will be stopped automatically)
            this._logError("SCAN", error);
            return
        }

        // Check if it is a device you are looking for
        console.log(device.name)
        if (device.name === 'FORMULAPRO' ){
            console.log("Device: " + device.name);
            console.log("UUID: " + device.serviceUUIDs);
            console.log("id: " + device.id);
            // Stop scanning as it's not necessary if you are scanning for one device.
            this.manager.stopDeviceScan();
            console.log("stopped scanning");
            // Proceed with connection.
            device.connect()
              .then((device) => {
                console.log("Discovering services and characteristics");
                return device.discoverAllServicesAndCharacteristics();

              })
              .then((device) => {
                console.log("Reading characteristic for service")
                // Read networks from device, then send network choice back
                // this.manager.monitorCharacteristicForDevice(
                //   device.id,
                //   'AFC672E8-6CA4-4252-BE86-B6F20E3F7467', 
                //   'B042EA6D-CC2E-4B53-A8BB-D14785AF9A2B',
                //   (error, c) => {
                //     console.log('in monitor')
                //         if (error) {
                //           console.log(error);
                //         }
                //         else {
                //           console.log('received value - ')
                //           console.log(base64.decode(c.value))
                //         }
                //     }
                // )
                device.readCharacteristicForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', 'B042EA6D-CC2E-4B53-A8BB-D14785AF9A2B')
                .then(characteristic => {
                  collectedNetworks = JSON.parse(base64.decode(characteristic.value))["networks"]
                  uniqueNetworks = Array.from(new Set(collectedNetworks))
                  console.log(uniqueNetworks)
                  this.setState({
                    device: device,
                    isLoading: false,
                    networks: uniqueNetworks
                  })
              })})
              .catch((error) => {
                this._logError("CONNECT", error);
              });
          }
      });
  }

  _log = (text: string, ...args) => {
    const message = "[" + Date.now() % 10000 + "] " + text;
    this.setState({
      text: [message, ...this.state.text]
    });
  };

  _logError = (tag: string, error: BleError) => {
    console.log(
      tag +
        "ERROR(" +
        error.errorCode +
        "): " +
        error.message +
        "\nREASON: " +
        error.reason +
        " (att: " +
        error.attErrorCode +
        ", ios: " +
        error.iosErrorCode +
        ", and: " +
        error.androidErrorCode +
        ")"
    );
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={{flex: 1, paddingTop: 100}}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Picker 
                selectedValue={this.state.chosenNetwork}
                onValueChange={(itemValue, itemIndex) => this.setState({chosenNetwork: itemValue})} >
                {this.state.networks.map((result, index) =>
                  <Picker.Item 
                    label={result} 
                    value={result}
                    key={index} 
                  />
                  )
                } 
        </Picker>
        <TextInput style = {styles.input}
          placeholder="Enter Password" 
          secureTextEntry={true} 
          onChangeText={(text) => this.setState({input: text})}/>
          {!!this.state.inputError && (<Text style = {styles.err} >{this.state.inputError}</Text>)}
        <Button 
          title = "Submit"
          onPress={() => {
             if (this.state.input.trim() === "") {
                this.setState(() => ({ inputError: "Password required."}));
             } else {
                this.setState(() => ({ inputError: null}))
                this.sendCredentials();
            }
          }
          }/>
          <Text style = {styles.submitButtonText}> Submit </Text>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    paddingTop:100,
    flex: 1,
    backgroundColor: '#fff',
  },
  input: {
    margin: 15,
    height: 40,
    borderColor: '#7a42f4',
    borderWidth: 1
 },
  err: {
    margin: 15,
    height: 40,
    color: '#FF0000'
 },
  submitButtonText:{
    color: 'white'
}
});
