import { IonButton, IonContent, IonFooter, IonPage } from '@ionic/react';
import React from 'react';

class ChatPage extends React.Component {

    componentDidMount() {
        const PhoneScheme: any = window['phonescheme'];
        console.log(new PhoneScheme.Interpreter());

    }

    render() {
        return <>
            <IonPage>
                <IonContent>

                </IonContent>
            </IonPage>
        </>;
    }
}

export default ChatPage;