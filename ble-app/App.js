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
    this.state = {
      text: []
    };
  }

  componentDidMount() {
    const manager = new BleManager();
    manager.onStateChange(newState => {
      if (newState != "PoweredOn") return;
      this._log("Started scanning...");
      manager.startDeviceScan(
        null, // AFC672E8-6CA4-4252-BE86-B6F20E3F7467
        {
          allowDuplicates: true
        },
        (error, device) => {
          if (error) {
            this._logError("SCAN", error);
            return;
          }
          if (device.name == "CC_BLE"){
            this._log("Device: " + device.name, device);
            this._log("UUID: " + device.serviceUUIDs, device);
            this._log("id: " + device.id, device);
            console.log(device);
            manager.stopDeviceScan()
          }
          
        }
      );
    }, true);
  }

  getServicesAndCharacteristics(device) {
    return new Promise((resolve, reject) => {
        device.services().then(services => {
            const characteristics = [];
            services.forEach((service, i) => {
                service.characteristics().then(c => {
                    characteristics.push(c);
                    if (i === services.length - 1) {
                        const temp = characteristics.reduce(
                            (acc, current) => {
                                return [...acc, ...current]
                            },
                            []
                        );
                        const dialog = temp.find(
                            characteristic =>
                                characteristic.isWritableWithoutResponse
                        );
                        if (!dialog) {
                            reject('No writable characteristic')
                        }
                        resolve(dialog)
                    }
                })
            })
        })
    })
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
