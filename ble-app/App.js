import React from 'react';
import {
  AppRegistry,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  SafeAreaView,
  StatusBar,
  FlatList,
  Picker,
  Field,
  Platform,
  Button,
  View
} from "react-native";
import { AppLoading, Asset, Font, Icon } from 'expo';
import AppNavigator from './navigation/AppNavigator';
import { BleManager, Device, BleError, LogLevel } from "react-native-ble-plx";
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

// type Props = {};

// type State = {
//   text: Array<string>
// };

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
      PickerValueHolder : '',
      readInData : '',
      input : '',
      //inputError :  null
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
    console.log(this.state.input)
    // Write to SSID characteristic
    this.state.device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', '1448ef56-f2dc-4593-9f17-32cd59fb7774', 'ZXphcHBhcmVs')
    // Write to PASS characteristic
    this.state.device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', '8204321F-D4bE-4556-9537-2EADB108D28E', 'MjEyMjc5OTcyMw==')
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
        if (device.name === 'CC_BLE'){
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
                // Read networks from device, then send network choice back
                device.readCharacteristicForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', 'B042EA6D-CC2E-4B53-A8BB-D14785AF9A2B')
                .then(characteristic => {
                  if (characteristic.value == "ZXphcHBhcmVs") { // ezapparel
                    console.log("Read: ")
                    console.log(characteristic.value)
                    this.setState({
                      device: device,
                      isLoading: false,
                      readInData: characteristic.value
                    })
                  }})})
              //   }.then()
                
              //       console.log("Writing to device")
              //       console.log(device.name)

              //       console.log(this.state);

              //       // Write to SSID characteristic
              //       device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', '1448ef56-f2dc-4593-9f17-32cd59fb7774', 'ZXphcHBhcmVs')
              //       // Write to PASS characteristic
              //       device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', '8204321F-D4bE-4556-9537-2EADB108D28E', 'MjEyMjc5OTcyMw==')
              //     }
              //   })
              // })
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

  delay = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  };

  state = {
    isLoadingComplete: false,
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
                selectedValue={this.state.PickerValueHolder}
    
                onValueChange={(itemValue, itemIndex) => this.setState({PickerValueHolder: itemValue})} >
    
                <Picker.Item label={this.state.readInData} value={this.state.readInData} />
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

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/robot-dev.png'),
        require('./assets/images/robot-prod.png'),
      ]),
      Font.loadAsync({
        // This is the font that we are using for our tab bar
        ...Icon.Ionicons.font,
        // We include SpaceMono because we use it in HomeScreen.js. Feel free
        // to remove this if you are not using it in your app
        'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      }),
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };
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
