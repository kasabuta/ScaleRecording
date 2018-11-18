//. ブラウザによる差異を吸収
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
 
//. バッファサイズ等
var audioContext = new AudioContext();
//音声解析
var audioAnalyser = null;
var bufferSize = 4096;
var flag = 0;
var timer_s = 0;
var timer = 0;
var myArrayBuffer;
var recordedBuffer = [];
var recordedChunks = [];
var record_data = [];
var audioData_wave;
var recording_time = 1000;
var graph_margin=20;
var tone = ["do","re","mi","fa","so","la","ti","hido"];

function Initialize(){
	audioData_wave = [];	//録音データ
	recordedChunks = [];
	record_data = [];
	// pianoの描画
	var piano = document.getElementById('piano');
	var pianoContext = piano.getContext('2d');
	pianoContext.clearRect(0,0,piano.width,piano.height);
	var keywidth=(piano.width-graph_margin/2)/8
	//白鍵
	for(var i=0;i<8;i++){
		pianoContext.strokeRect(keywidth*i,0,keywidth,piano.height);
	}
	//黒鍵
	pianoContext.fillRect(keywidth*0.70,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*1.70,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*3.70,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*4.70,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*5.70,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*7.70,0,keywidth*0.3,piano.height*0.6);
	
	pianoContext.stroke();
	// canvasの初期化
	GraphInitialize();
	var singer = document.getElementById('singer');
	singer.src="offrec.png";
	// 結果の非表示処理
	var animation = anime.timeline();
	animation.add({
		targets:".fade",
		opacity:0,
		scaleY:0,
		autoplay:false,
		duration:0
	});
}

function GraphInitialize(){
	//キャンバス情報の取得
	var canvas = document.getElementById('graph');
	var canvasContext = canvas.getContext('2d');
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	// x軸の線(横線)とラベル出力
	// Draw grid (Y)
	canvasContext.fillRect(graph_margin, 0, canvas.width-graph_margin*2, 1);
	canvasContext.fillRect(graph_margin, (canvas.height-graph_margin)/2, canvas.width-graph_margin*2, 1);
	canvasContext.fillRect(graph_margin, canvas.height-graph_margin, canvas.width-graph_margin*2, 1);
	// Draw text (Y)
	
	// 500ms単位にy軸の線(縦線)とラベル出力
	for(var i=0;i*500<=recording_time;i++){
		//var text = (s < 1000) ? (s + ' ms') : ((s / 1000) + ' s');
		var text = String(i*0.5) + ' s';
		var x=graph_margin+((canvas.width-graph_margin*2)/(recording_time/500))*i;
		// Draw grid (X)
		canvasContext.fillRect(x, 0, 1, canvas.height-graph_margin);
		// Draw text (X)
		canvasContext.fillText(text, x-8, canvas.height-graph_margin/2);
	}
	canvasContext.stroke();
	var singer = document.getElementById('singer');
	singer.src="onrec.png";
}

// toneの引数(0-7)により、なってる音を色付け。
function DrawPiano(tone){
	var singer = document.getElementById('singer');
	singer.src="offrec.png";
	var piano = document.getElementById('piano');
	var pianoContext = piano.getContext('2d');
	pianoContext.clearRect(0,0,piano.width,piano.height);
	var keywidth=(piano.width-graph_margin/2)/8
	//白鍵
	for(var i=0;i<8;i++){
		if(i==tone){
			pianoContext.fillStyle="#97ff69";
			pianoContext.fillRect(keywidth*i,0,keywidth,piano.height);
			pianoContext.fillStyle="#000000";
		}else{
			pianoContext.strokeRect(keywidth*i,0,keywidth,piano.height);
		}
	}
	//黒鍵
	pianoContext.fillRect(keywidth*0.7,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*1.7,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*3.7,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*4.7,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*5.7,0,keywidth*0.6,piano.height*0.6);
	pianoContext.fillRect(keywidth*7.7,0,keywidth*0.3,piano.height*0.6);
	
	pianoContext.stroke();
	
}
 
//. 音声処理開始
function Record(){
	
  navigator.getUserMedia(
    { audio: true },
    function( stream ){
    	var idx=0;
        recordedBuffer = [];
        var mediaRecorder = new MediaRecorder(stream);
  	  	audioAnalyser = audioContext.createAnalyser();
	  	audioAnalyser.fftSize = 2048;
        timer=timer_s;
        var audio=[];
    	for(var i=0;i<8;i++){
    		audio[i] = new Audio("./sample_wave/"+tone[i]+".wav");
    	}
		// 再生するピアノの描画
		DrawPiano(0);
		// お手本ピアノの再生
		audio[0].play();
    	// 2秒でストップ
    	setTimeout(function(){audio[0].pause();},recording_time);
    	var count=1;
    	function Scale_Recording(count){
    		if(count>7){
    	    	audio[7].addEventListener('pause',function(){
    	    		// 録音波形の初期化
    	    		GraphInitialize();
    	        	// タイマーセット
    	        	timer_s = new Date();
    	        	timer=timer_s;
            		// 録音チャンクのリセット
            		recordedChunks=[];
        	    	// 録音開始
    	    		mediaRecorder.start();
            	    javascriptnode.onaudioprocess = onAudioProcess;
    	        	// n秒で録音終了
    	        	setTimeout(function(){
    	        		//stream.getAudioTracks()[0].stop();
    	        		mediaRecorder.stop();
    	        	    javascriptnode.onaudioprocess = null;
    	        		var singer = document.getElementById('singer');
    	        		singer.src="offrec.png";
    	            	}, recording_time);
    	    	});
    	    	return;
    		}
	    	audio[count-1].addEventListener('pause',function(){
        		// 録音波形の初期化
        		GraphInitialize();
            	// タイマーセット
            	timer_s = new Date();
	        	timer=timer_s;
        		// 録音チャンクのリセット
        		recordedChunks=[];
		    	// 録音開始
	    		mediaRecorder.start();
        	    javascriptnode.onaudioprocess = onAudioProcess;
	        	setTimeout(function(){
	            	// n秒で録音終了
	        		//stream.getAudioTracks()[0].stop();
	        		mediaRecorder.stop();
	        	    javascriptnode.onaudioprocess = null;
	        		// 再生するピアノの描画
	        		DrawPiano(count);
	        		// お手本ピアノの再生
	        		audio[count].play();
	            	// 2秒でストップ
	            	setTimeout(function(){audio[count].pause(); count++; Scale_Recording(count);},recording_time);
	            	}, recording_time);
	        });
	    	return;
    	}
    	Scale_Recording(count);

		// 録音準備
	    var javascriptnode = audioContext.createScriptProcessor( bufferSize, 1, 1 );
	    var mediastreamsource = audioContext.createMediaStreamSource( stream );
	    window.dotnsf_hack_for_mozzila = mediastreamsource;  //. https://support.mozilla.org/en-US/questions/984179
	    mediastreamsource.connect( javascriptnode );
	    javascriptnode.connect( audioContext.destination );
	    javascriptnode.onaudioprocess = onAudioProcess;
	  	mediastreamsource.connect(audioAnalyser);
        
      mediaRecorder.addEventListener('dataavailable', function(e) {
	if (e.data.size > 0) {
	  recordedChunks.push(e.data);
	}
      });

      mediaRecorder.addEventListener('stop', function() {
    	  record_data[idx]=recordedChunks[0];
    	  if(idx==7){
    		  finish();
    	  }
    	  idx++;
      });

    },function( e ){
      console.log( e );
    }
  );
}
//. 繰り返し呼ばれる処理
function onAudioProcess( e ){
	//録音処理
	//. 取得した周波数成分データ
    var wave = new Uint8Array(audioAnalyser.frequencyBinCount);
    audioAnalyser.getByteTimeDomainData(wave);
    // これまでのデータに追加
    Array.prototype.push.apply(audioData_wave,wave);
	
	// グラフの描画(音量を取ると同時にonFlagも設定)
	Draw_graph(wave);
}

//録音中の音声の表示
var Draw_graph = function(wave){
	//キャンバス情報の取得
	var canvas = document.getElementById('graph');
	var canvasContext = canvas.getContext('2d');

	canvasContext.beginPath();
	var newTimer = new Date();
	if(newTimer>timer_s+recording_time){
		newTimer = timer_s + recording_time;
	}
	var xs = graph_margin + (canvas.width-graph_margin*2)*((timer-timer_s)/recording_time);
	var xe = graph_margin + (canvas.width-graph_margin*2)*((newTimer-timer_s)/recording_time);
	for (var i = 0; i < wave.length; i++) {
		//canvasにおさまるように線を描画
		var x = xs + (xe-xs)/wave.length*i;
		var y = (canvas.height-graph_margin)/2 + (wave[i]-128)/256 * canvas.height;
		if(y>canvas.height-graph_margin){
			y=canvas.height-graph_margin;
		}else if(y<0){
			y=0;
		}
		if (i === 0) {
			canvasContext.moveTo(x, y);
		} else {
			canvasContext.lineTo(x, y);
		}
	}
	canvasContext.stroke();
	timer = newTimer;
}

// 録音処理終了後のメッセージ
function finish(){
	// 結果の表示処理
	var animation = anime.timeline();
	animation.add({
		targets:".fade",
		opacity:1,
		scaleY:1,
		easing:"linear",
		autoplay:false,
		duration:1000
	});
	
}

// データをミックスして再生
function Play_rec(){
	var bloburl = [];
	var audio_rec = [];
	var audio_idx=0;
	for(var i=0;i<8;i++){
		bloburl[i] = window.URL.createObjectURL( record_data[i] );
		audio_rec[i] = new Audio(bloburl[i]);
		audio_rec[i].currentTime = 0.4;
		
	}
	for(var i=0;i<7;i++){
    	audio_rec[i].addEventListener('pause',function(){
    		audio_idx++;
    		audio_rec[audio_idx].play();
    		setTimeout(function(){audio_rec[audio_idx].pause();},200);
    	});
	}
	audio_rec[0].play();
	setTimeout(function(){audio_rec[0].pause();},200);
}

/*
function Play_rec(){
	var bloburl = window.URL.createObjectURL( record_data[1] );
	var audio_rec = new Audio(bloburl);
	audio_rec.currentTime = 0.4;
	audio_rec.play();
	var bloburl2 = window.URL.createObjectURL( record_data[2] );
	var audio_rec2 = new Audio(bloburl);
	audio_rec2.play();
}
*/
// データをミックスして曲を再生
function Play_music(song){
	var bloburl = [];
	var audio_rec = [];
	var note_idx;
	var score = [];
	var play_speed = 200;
	for(var i=0;i<8;i++){
		bloburl[i] = window.URL.createObjectURL( record_data[i] );
	}
	// 譜面データ（-1が休符）
	if(song=="kaeru"){
		score = [0,1,2,3,2,1,0,-1,2,3,4,5,4,3,2];
	}else if(song=="choucho"){
		score = [4,2,2,-1,3,1,1,-1,0,1,2,3,4,4,4];
	}else if(song=="churippu"){
		score = [0,1,2,-1,0,1,2,-1,4,2,1,0,1,2,1];
	}else if(song=="morobito"){
		score = [7,7,7,7,6,6,6,5,4,4,4,4,4,4,3,3,2,2,2,2,1,1,1,1,0,0,0,0,0,0];
	}else if(song=="rondon"){
		score = [4,4,4,5,4,4,3,3,2,2,3,3,4,4,4,4];
	}else if(song=="seija"){
		score = [0,2,3,4,4,4,4,-1,0,2,3,4,4,4,4,-1,0,2,3,4,4,2,2,0,0,2,2,1,1,1,1,1];
	}
	// 曲の演奏
	var note=[];
	for(var i=0;i<score.length;i++){
		if(score[i]<0){
			note[i]=null;
		}else{
			note[i] = new Audio(bloburl[score[i]]);
			note[i].currentTime=0.4;
		}
	}
	note_idx=1;
	for(var i=0;i<(score.length-1);i++){
		if(note[i+1]==null){
			note[i].addEventListener('pause',function(){
    			note_idx++;
        		setTimeout(function(){
        			note[note_idx].play();
        			setTimeout(function(){note[note_idx].pause();},play_speed);
            		note_idx++;
        			},play_speed);
			});
			i++;
		}else{
			note[i].addEventListener('pause',function(){
    			note[note_idx].play();
        		setTimeout(function(){note[note_idx].pause();},play_speed);
        		note_idx++;
			});
		}
	}
	note[0].play();
	setTimeout(function(){note[0].pause();},play_speed);
}



// データをphpに送信して保存
function Send_php(){
	var bloburl=[];
	for(var i=0;i<8;i++){
		bloburl[i] = window.URL.createObjectURL( record_data[i] );
	}
	var name = document.getElementById("name").value;
	
    $.ajax({
      url : "./scale_rec.php",
      type : "POST",
	  data: {
		    name : name,
		    dowav : bloburl[0],
		    rewav : bloburl[1],
		    miwav : bloburl[2],
		    fawav : bloburl[3],
		    sowav : bloburl[4],
		    lawav : bloburl[5],
		    tiwav : bloburl[6],
		    hidowav : bloburl[7]
		  },
      cache : false,
      contentType : false,
      processData : false,
      success : function(r) {
        alert("Success!");
      }
    });
}

				 
