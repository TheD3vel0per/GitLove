import { IonButton, IonLabel, IonAvatar, IonContent, IonFooter, IonItem, IonPage } from '@ionic/react';
import * as firebase from 'firebase';
import React from 'react';
import { filter, mergeAll, take } from 'rxjs/operators';
import { Gender, User } from '../interfaces/User';
import { getUserService } from '../services/GetUserService';
import ChatPage from '../components/ChatMessage'

//inclde firebase

class UserMessage extends React.Component {


    state = {
        user: {
            _id: '',
            name: 'string',
            profilePicture: '',
            gender: Gender.Male,
            dateOfBirth: new firebase.firestore.Timestamp(0, 0),
            description: '',
            features: [],
            languages: [],
            blockedUsers: [],
            likedUsers: [],
        },
        match : {
            _id: '',
            matchedUsers: ['foo', 'bar'],
            message: {
                authorUid: '',
                code: '',
            },
            lastMatchActivity: new firebase.firestore.Timestamp(0, 0)
        }
    }

    constructor(props) {
        super(props);
        this.state.match = props['match'];
    }

    componentDidMount() {
        const myId: string = firebase.auth().currentUser.uid;
        const otherId: string = this.state.match.matchedUsers.filter(id => id !== myId)[0];

        getUserService
            .Users$
            .pipe(
                mergeAll(),
                filter(user => user._id == otherId),
                take(1)
            )
            .subscribe(data => {
                this.setState({
                    match: data
                });
            });
    }

    render() {
        return <>
            <IonItem button onClick={() => {}}>
                <IonAvatar slot="start">
                    <img src={this.state.user.profilePicture}/> 
                </IonAvatar>
                <IonLabel>
                    <h2>{this.state.user.name}</h2>
                    <p> {this.state.user.description}</p>
                </IonLabel>
            </IonItem>
        </>;
    }
}

export default UserMessage;