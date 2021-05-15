import m from "mithril";
import * as tf from "@tensorflow/tfjs"

(async () => {
    tf.setBackend('cpu');
    
    let myCanvas: HTMLCanvasElement;
    let myButton: HTMLButtonElement;
    let myVideo: HTMLVideoElement;

    let width: number = 320;
    let height: number = 0;
    let streaming: boolean = false;

    const startup = () => {
        m.render(document.body, mainBody);

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                myVideo.srcObject = stream;
                myVideo.play();
            })
            .catch(function (err) {
                console.log(`An error occurred: ${err}`);
            });
        clearPhoto();
    };

    const takePicture = () => {
        let context = myCanvas.getContext('2d');
        if (width && height) {
            myCanvas.width = width;
            myCanvas.height = height;
            if (context) {
                context.drawImage(myVideo, 0, 0, width, height);
            }

        } else {
            clearPhoto();
        }
    };

    const clearPhoto = () => {
        let context = myCanvas.getContext('2d');
        if (context) {
            context.fillStyle = "#AAA";
            context.fillRect(0, 0, myCanvas.width, myCanvas.height);
        }
    };


    const mainBody = m("div",
        [
            m("div",
                {
                    style: {
                        display: "inline-block",
                        width: "340px"
                    }
                },
                [
                    m("video", {
                        oncreate: (vnode) => {
                            myVideo = vnode.dom as HTMLVideoElement;
                        },
                        oncanplay: () => {
                            if (!streaming) {
                                height = myVideo.videoHeight / (myVideo.videoWidth / width);
                                myVideo.width = width;
                                myVideo.height = height;
                                myCanvas.width = width;
                                myCanvas.height = height;
                                streaming = true;
                            }
                        }
                    }),
                    m("button", {
                        oncreate: (vnode) => {
                            myButton = vnode.dom as HTMLButtonElement;
                        },
                        onclick: () => {
                            takePicture();
                        },
                        style: {
                            display: "block",
                            position: "relative",
                            marginLeft: "auto",
                            marginRight: "auto",
                            bottom: "32px",
                            backgroundColor: "rgba(0, 150, 0, 0.5)",
                            border: "1px solid rgba(255, 255, 255, 0.7)",
                            boxShadow: "0px 0px 1px 2px rgba(0, 0, 0, 0.2)",
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 1.0)"
                        }
                    }, "CLICK ME")
                ]
            ),
            m("canvas", {
                oncreate: (vnode) => {
                    myCanvas = vnode.dom as HTMLCanvasElement;
                },
                style: {
                    verticalAlign: "top"
                }
            }),
        ]
    );

    const load_model = async (weight_path: string) => {
        return tf.loadLayersModel(weight_path);
    }

    startup();
    takePicture();
    // let weight_path = 'weight/256_256_resfcn256_weight.index'
    let weight_path = './model/model.json';
    let model = await load_model(weight_path);
    console.log(model);
    const response = await fetch('./test.png');
    const blob = await response.blob();
    const img = new Image();
    let imgTensor;
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    img.addEventListener('load', () => {
        ctx?.drawImage(img, 0, 0);
        imgTensor = tf.browser.fromPixels(img).resizeBilinear([224, 224]).reshape([1, 224, 224, 3]);
        console.log(imgTensor);
        const result = model.predict(imgTensor);
        console.log(
            (Array.isArray(result) ? result
            : [result]).map((r) => r.array())
        );
    })
    img.src = './test.png';
})();
