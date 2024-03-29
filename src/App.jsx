import ParticlesBg from 'particles-bg'
import './App.css'
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm'
import Logo from './components/Logo/Logo'
import Navigation from './components/Navigation/Navigation'
import Rank from './components/Rank/Rank'
import React, { Component } from 'react'
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import Signin from './components/Signin/Signin'
import Register from './components/Register/Register'
import Modal from "./components/Modal/Modal"
import Profile from './components/Profile/Profile'

const PAT = 'a30cecf1be134f50815736af065c02c0';
// Specify the correct user_id/app_id pairings
// Since you're making inferences outside your app's scope
const USER_ID = 'paul23';       
const APP_ID = 'my-first-application';
// Change these to whatever model and image URL you want to use
const MODEL_ID = 'face-detection';
const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';    

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
    pet: '',
    age: ''
  }
}
export default class App extends Component {

  constructor() {
    super();
    this.state = initialState
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFacesLocation = (data) => {
    return data.outputs[0].data.regions.map(face => {
      const clarifaiFace = face.region_info.bounding_box  
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);
      return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - (clarifaiFace.right_col * width),
        bottomRow: height - (clarifaiFace.bottom_row * height)
      }
    });
    
  }

  displayFaceBoxes = (boxes) => {
    this.setState({boxes: boxes});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }
  onButtonSubmit = () => {
      this.setState({imageUrl: this.state.input})
      const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": this.state.input
                    }
                }
            } 
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };

    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions)
        .then(response => response.json())
        .then(result => {
          console.log(result);
          if(result){
            fetch('http://localhost:3000/image', {
              method: 'put',
              headers: {'Content-type': 'application/json'},
              body: JSON.stringify({
                id: this.state.user.id
              })
            }).then(response => response.json())
            .then(count =>{
              this.setState(Object.assign(this.state.user, { entries: JSON.parse(count.entries)}))
            })
            .catch(error => console.log)
          }
          this.displayFaceBoxes(this.calculateFacesLocation(result));
        })
        .catch(error => console.log('error', error));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      return this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }
  
  toggleModal = () => {
    this.setState(pervState => ({
      ...pervState,
      isProfileOpen: !pervState.isProfileOpen
    }))
  }   
  render() {
    return (
      <div className="App">
        <ParticlesBg type="cobweb" bg={true} color={["FFFFFF"]}  className="particles"/>
        <Navigation 
          isSignedIn={this.state.isSignedIn} 
          onRouteChange={this.onRouteChange}
          toggleModal={this.toggleModal}/>
        { this.state.isProfileOpen  && 
          <Modal>
            <Profile 
              isProfileOpen={this.state.isProfileOpen} 
              toggleModal={this.toggleModal}
              loadUser={this.loadUser}
              user={this.state.user}/>
          </Modal>}
        { this.state.route === 'home'
          ? <div>
              <Logo />
              <Rank
                name={this.state.user.name} entries={this.state.user.entries}
              />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition boxes={this.state.boxes} imageUrl={this.state.imageUrl} />
            </div>
          : (
             this.state.route === 'signin'
             ? <Signin  onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
             : <Register  onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
            )
        }
      </div>
    )
  }
}

