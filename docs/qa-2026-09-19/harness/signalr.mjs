import { createRequire } from 'node:module';
import path from 'node:path';
import { root } from './client.mjs';
const require = createRequire(path.join(root,'Frontend/Smart-Exam-App-main/package.json'));
const signalR = require('@microsoft/signalr');

export async function connectSignalR(client,evidence,label) {
  const events=[];
  const connection=new signalR.HubConnectionBuilder()
    .withUrl(`${client.base}/hubs/proctor`,{accessTokenFactory:()=>client.token,transport:signalR.HttpTransportType.WebSockets,skipNegotiation:true})
    .withAutomaticReconnect([0,1000,3000]).configureLogging(signalR.LogLevel.None).build();
  for(const event of ['PeerJoined','PeerLeft','ReceiveWarning','SessionTerminated','TimeExtended','ExamSubmitted','ConnectionStatusChanged','ScreenShareStatusChanged','ReceiveOffer','ReceiveAnswer','ScreenPeerJoined'])
    connection.on(event,payload=>{events.push({event,payload,at:Date.now()});evidence?.record({signalR:label,event,payload});});
  connection.onreconnecting(error=>evidence?.record({signalR:label,event:'reconnecting',error:error?.message}));
  connection.onreconnected(id=>evidence?.record({signalR:label,event:'reconnected',connectionId:id}));
  await connection.start();
  evidence?.record({signalR:label,event:'connected'});
  return {connection,events};
}
