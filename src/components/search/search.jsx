import React from 'react';
import { bindAll } from 'lodash';
import Autocomplete from 'react-google-autocomplete';
import { getUserGeo, geoToAddress } from '../../util/google_maps/location_api';
import Loading from '../loading';

const UBER_PRODUCTS= ["uberX", "POOL", "uberXL", "BLACK", "SUV"];

class Search extends React.Component {
  constructor(props) {
    super(props);

    bindAll(this, 'createETA', 'getTime','handleSelectDestination',
      'renderOriginAutocomplete', 'renderDestinationAutocomplete', 'centsToDollars',
      'renderResults', 'getUberResults','getLyftResults', 'getUserLocation');
  }

  componentDidMount() {
    // TODO temporary fixed start point for testing until we can get user's geolocation with navigator.geolocation.getCurrentPosition()

    this.getUserLocation().then(address => {
      this.props.updateCurrentAddress(address);
    });
  }

  componentWillReceiveProps(newProps) {
    if (this.props.quotes.address.current === ""){
      this.props.getCurrentGeolocation(newProps.quotes.address.current);
    } else {
      const newGeos = newProps.quotes.geolocations;
      const oldGeos = this.props.quotes.geolocations;

      if (newGeos.current !== "" && newGeos.destination !== "" &&
        (newGeos.current.lat !== oldGeos.current.lat ||
          newGeos.current.lng !== oldGeos.current.lng ||
          newGeos.destination.lat !== oldGeos.destination.lat ||
          newGeos.destination.lng !== oldGeos.destination.lng)) {
        this.props.clearStuff();
        this.props.getLyftQuotes(newGeos.current.lat, newGeos.current.lng,
          newGeos.destination.lat, newGeos.destination.lng);
        this.props.getUberQuotes(newGeos.current.lat, newGeos.current.lng,
          newGeos.destination.lat, newGeos.destination.lng);
        this.props.getLyftETAs(newGeos.current.lat, newGeos.current.lng);
        this.props.getUberETAs(newGeos.current.lat, newGeos.current.lng);
      }
    }
  }

  getUserLocation() {
    let coords;
    const that = this;

    return getUserGeo()
      .then(res => {
        coords = res.location;
        return geoToAddress(coords.lat, coords.lng)
        .then(res2 => {
          coords = res2;
          return coords.results[0].formatted_address;
        });
      });
  }

  // getCar(name){
  //   switch (name) {
  //     case "POOL":
  //       return <img className="uber-cars" src={require('../../../app/images/uberX.png')}/>;
  //     case "uberX":
  //       return <img className="uber-cars" src={require('../../../app/images/uberX.png')}/>;
  //     case "BLACK":
  //       return <img className="uber-cars" src={require('../../../app/images/black.png')}/>;
  //     case "uberXL":
  //       return <img className="uber-cars" src={require('../../../app/images/uberXL.png')}/>;
  //     case "SUV":
  //       return <img className="uber-cars" src={require('../../../app/images/SUV.png')}/>;
  //     default:
  //
  //   }
  // }

  // this.props.getCurrentGeolocation(this.state.current_address);

  handleSelectDestination(place) {
    this.props.updateDestinationAddress(place.formatted_address);
    this.props.getDestinationGeolocation(this.props.quotes.address.destination);
    // this.setState({destination_geolocation: });
  }

  handleSelectOrigin(place) {
    this.props.updateCurrentAddress(place.formatted_address);
    this.props.getCurrentGeolocation(this.props.quotes.address.current);
  }

  renderDestinationAutocomplete() {
    return <Autocomplete
      onPlaceSelected={ (place) => this.handleSelectDestination(place) }
      placeholder="Enter a destination"
      types={'address'}/>;
  }

  renderOriginAutocomplete() {
    return <Autocomplete
      onPlaceSelected={ (place) => this.handleSelectOrigin(place) }
      placeholder={this.props.quotes.address.current}
      types={'address'}/>;
  }

  getUberResults() {
    const that = this;

    return this.props.quotes.prices.uber.map(productObj => {
      if (productObj.high_estimate > 0 &&
        UBER_PRODUCTS.includes(productObj.display_name)) {
        return (
          <li key={productObj.display_name} className="uber-lineitem">
            <h3 className="uber-key-data">{productObj.display_name}</h3>
            <h3 className="uber-key-data">{productObj.estimate}</h3>
            <div className="uber-lineitem-times">
              <div className="time-inner-div">
                <h5>{that.getTime(productObj.display_name)} min</h5>
                <h5>away</h5>
              </div>
              <div className="time-inner-div">
                <h5>ETA:</h5>
                <h5>
                  {this.createETA(that.getTime(productObj.display_name)
                    + (productObj.duration / 60))}
                </h5>
              </div>
            </div>
          </li>
        );
      }
    });
  }

  getLyftResults() {
    const that = this;
    return this.props.quotes.prices.lyft.map(productObj => {
      if (productObj.estimated_cost_cents_max > 0) {
        return (
          <li key={productObj.display_name}
            className="uber-lineitem">
              <h3 className="uber-key-data">{productObj.display_name}</h3>
              <h3 className="uber-key-data">{that.centsToDollars(productObj.estimated_cost_cents_min,
                productObj.estimated_cost_cents_max)}</h3>
              <div className="uber-lineitem-times">
                <div className="time-inner-div">
                  <h5>{that.getTime(productObj.display_name)} min</h5>
                  <h5>away</h5>
                </div>
                <div className="time-inner-div">
                  <h5>ETA:</h5>
                  <h5>
                    {that.createETA(that.getTime(productObj.display_name)
                      + Math.ceil(productObj.estimated_duration_seconds / 60))}
                  </h5>
                </div>
              </div>
            </li>
        );
      }
    });
  }


  createETA(rideLength) {
    const now = new Date();
    let hrs = now.getHours();
    let mins = now.getMinutes();
    let indicator;
    mins = (mins + rideLength) % 60;
    if(mins < 10){
      mins = `0${mins}`;
    }
    if (now.getMinutes() + rideLength > 59) {
      hrs = (hrs + 1) % 24;
    }

    if (hrs > 12) {
      hrs -= 12;
      indicator = "PM";
    } else if(hrs === 12) {
      indicator = "PM";
    } else if(hrs > 0) {
      indicator = "AM";
    } else {
      hrs = 12;
      indicator = "AM";
    }

    return `${hrs}:${mins} ${indicator}`;
  }

  getTime(displayName) {
    let time;
    this.props.quotes.times.uber.forEach(timeObj => {
      if (timeObj.display_name === displayName) {
        time = timeObj.estimate / 60;
      }
    });
    this.props.quotes.times.lyft.forEach(timeObj => {
      if (timeObj.display_name === displayName) {
        time = timeObj.eta_seconds / 60;
      }
    });
    return time;
  }

  // getLyftTime(displayName) {
  //   let time;
  //   this.props.quotes.times.lyft.forEach(timeObj => {
  //     if (timeObj.display_name === displayName) {
  //       time = timeObj.estimate / 60;
  //     }
  //   });
  //   return time;
  // }

  centsToDollars(min, max) {
    let newMin = min;
    let newMax = max;
    if(newMin % 100 === 0){
      newMin = `$${newMin / 100}.00`;
    }else if(newMin % 10 === 0){
      newMin = `$${newMin / 100}0`;
    }else{
      newMin = `$${newMin / 100}`;
    }
    if(newMax % 100 === 0){
      newMax = `${newMax / 100}.00`;
    }else if(newMax % 10 === 0){
      newMax = `${newMax / 100}0`;
    }else{
      newMax = `${newMax / 100}`;
    }

    if(min === max){
      return `${newMin}`;
    }

    return `${newMin}-${newMax}`;
  }


  renderResults() {
    if (this.props.quotes.prices.uber && this.props.quotes.prices.lyft) {
      return (
        <div className="quotes-container">
          <section className="ride-info">
            <h3>{this.props.quotes.prices.uber[0].distance} Mile Ride</h3>
          </section>

          <section className="results-container">
            <section className="uber-results">
              <div className="uber-header">
                <img id="uber-logo" src="../../../app/images/uber_rides_api_icon_2x_78px.png"/>
                <h1 className="company-titles">UBER</h1>
              </div>
              {this.getUberResults()}
            </section>

            <section className="lyft-results">
              <div className="uber-header">
                <img id="lyft-logo" src="../../../app/images/lyft_standard_silver.png"/>
              </div>
              {this.getLyftResults()}
            </section>
          </section>
        </div>
      );
    } else if (this.props.quotes.errors.uber && this.props.quotes.errors.lyft) {
      return (
        <div>
          <h6>{this.props.quotes.errors.uber}</h6>
          <h6>{this.props.quotes.errors.lyft}</h6>
        </div>
      );
    } else if (this.props.quotes.geolocations.current !== "" &&
        this.props.quotes.geolocations.destination !== "") {
      return <Loading/>;
    } else {
      return <div className="null"></div>;
    }
  }

  // TODO add location bias based on user's location https://github.com/ErrorPro/react-google-autocomplete https://developers.google.com/places/web-service/autocomplete#location_biasing

  render() {
    return (
      <div className="search-page">
        <div className="search-container">
          {this.renderOriginAutocomplete()}
          {this.renderDestinationAutocomplete()}
        </div>

        {this.renderResults()}
      </div>
    );
  }
}

export default Search;