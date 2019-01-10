import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
  Button,
  View
} from "react-native";
import { AppLoading, Asset, Font, Icon } from 'expo';
import AppNavigator from './navigation/AppNavigator';
import { BleManager, Device, BleError, LogLevel } from "react-native-ble-plx";

type Props = {};

type State = {
  text: Array<string>
};

function arrayBufferToHex(buffer) {
  if (!buffer) return null;
  const values = new Uint8Array(buffer);
  var string = "";
  for (var i = 0; i < values.length; i += 1) {
    const num = values[i].toString(16);
    string += num.length == 1 ? "0" + num : num;
  }
  return string;
}

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.manager = new BleManager();
    this.state = {
      text: []
    };
  }

  componentWillMount() {
    console.log("mounted")
    const subscription = this.manager.onStateChange((state) => {
      if (state ==='PoweredOn') {
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  scanAndConnect() {
    this._log("Started scanning...");
    this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
            // Handle error (scanning will be stopped automatically)
            this._logError("SCAN", error);
            return
        }

        // Check if it is a device you are looking for
        if (device.name === 'CC_BLE'){
            this._log("Device: " + device.name, device);
            this._log("UUID: " + device.serviceUUIDs, device);
            this._log("id: " + device.id, device);
            // Stop scanning as it's not necessary if you are scanning for one device.
            this.manager.stopDeviceScan();
            // Proceed with connection.
            device.connect()
              .then((device) => {
                this._log("Discovering services and characteristics");
                return device.discoverAllServicesAndCharacteristics()
              })
              .then((device) => {
                this._log("Writing to: ")
                this._log(device.name)
                // device.writeCharacteristicWithResponseForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', 'B042EA6D-CC2E-4B53-A8BB-D14785AF9A2B', 'SGVsbG8gZnJpZW5k')
                // .then((characteristic) => {
                //   console.log(characteristic)
                //   this._log(characteristic.value)
                //   return
                // })
                device.readCharacteristicForService('AFC672E8-6CA4-4252-BE86-B6F20E3F7467', 'B042EA6D-CC2E-4B53-A8BB-D14785AF9A2B')
                .then(characteristic => console.log(characteristic.value))
              })
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
    this._log(
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
    return (
      <SafeAreaView
        style={styles.container}
      >
        <Button
          onPress={() => {
            this.setState({
              text: []
            });
          }}
          title={"Clear"}
        />
        <FlatList
          style={styles.container}
          data={this.state.text}
          renderItem={({ item }) => <Text> {item} </Text>}
          keyExtractor={(item, index) => index.toString()}
        />
      </SafeAreaView>
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
    flex: 1,
    backgroundColor: '#fff',
  },
});
