import {bindAll} from 'lodash';
import React from 'react';
import Autocomplete from 'react-google-autocomplete';
import { getUserGeo, geoToAddress } from '../util/google_maps/location_api';

class Search extends React.Component {
  constructor(props){
    super(props);
    bindAll(this, 'handleSelectDestination', 'getUserLocation');
    this.state = {
      userLocation: ""
    };
  }

  componentDidMount(){
    // TODO temporary fixed start point for testing until we can get user's geolocation with navigator.geolocation.getCurrentPosition()
    let address;
    this.getUserLocation().then(res => {
      address = res;
      this.props.updateCurrentAddress(address);
    });
    // "160 Spear St, San Francisco, CA 94105, USA"
  }

  componentWillReceiveProps(newProps){
    if(this.props.quotes.address.current === ""){
      this.props.getCurrentGeolocation(newProps.quotes.address.current);
    } else{
      const newGeos = newProps.quotes.geolocations;
      const oldGeos = this.props.quotes.geolocations;
      if(newGeos.current !== "" && newGeos.destination !== ""
      &&
      (newGeos.current !== oldGeos.current
        ||
        newGeos.destination !== oldGeos.destination)){
          debugger
          this.props.getLyftQuotes(newGeos.current.lat, newGeos.current.long, oldGeos.current.lat, oldGeos.current.long);
          this.props.getUberQuotes(newGeos.current.lat, newGeos.current.long, oldGeos.current.lat, oldGeos.current.long);
          this.props.getLyftETAs(newGeos.current.lat, newGeos.current.long);
          this.props.getUberETAs(newGeos.current.lat, newGeos.current.long);
        }
    }
  }

  getUserLocation() {
    let coords;
    const that = this;
    return getUserGeo().then(res => {
      coords = res.location;
      return geoToAddress(coords.lat, coords.lng).then(res2 => {
        coords = res2;
        return coords.results[0].formatted_address;
      });
    });
  }



  // this.props.getCurrentGeolocation(this.state.current_address);

  handleSelectDestination(place){
    this.props.updateDestinationAddress(place.formatted_address);
    this.props.getDestinationGeolocation(this.props.quotes.address.destination);
    // this.setState({destination_geolocation: });
  }

  // TODO add location bias based on user's location https://github.com/ErrorPro/react-google-autocomplete https://developers.google.com/places/web-service/autocomplete#location_biasing
  render() {
    return (
      <div>
        <Autocomplete
          style={{width: '90%'}}
          onPlaceSelected={ (place) => this.handleSelectDestination(place) }
          types={'address'}
        />
      </div>
    );
  }
}

export default Search;
