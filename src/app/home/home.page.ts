import { Component, ViewChild, ElementRef } from '@angular/core';
import jsQR from 'jsqr';

import { ToastController, LoadingController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('video', { static: false }) video: ElementRef;
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @ViewChild('fileinput', { static: false }) fileinput: ElementRef;

  canvasElement: any;
  // video.nativeElement: any;
  canvasContext: any;
  scanActive = false;
  scanResult = null;
  loading: HTMLIonLoadingElement = null;
  stream: any;

  captures: string[] = [];
  error: any;
  isCaptured: boolean;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  WIDTH = 640;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HEIGHT = 480;

  // @ViewChild("video")
  // public video: ElementRef;

  // @ViewChild("canvas")
  // public canvas: ElementRef;

  constructor(
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private plt: Platform
  ) {
    // const isInStandaloneMode = () =>
    //   'standalone' in window.navigator && window.navigator;
    // if (this.plt.is('ios') && isInStandaloneMode()) {
    //   console.log('I am a an iOS PWA!');
    //   // E.g. hide the scan functionality!
    // }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  AfterViewInit() {
    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d');
    this.video.nativeElement = this.video.nativeElement;
  }

  // Helper functions
  async showQrToast() {
    const toast = await this.toastCtrl.create({
      message: `Open ${this.scanResult}?`,
      position: 'top',
      buttons: [
        {
          text: 'Open',
          handler: () => {
            window.open(this.scanResult, '_system', 'location=yes');
          }
        }
      ]
    });
    toast.present();
  }

  reset() {
    this.scanResult = null;
  }

  stopScan() {
    this.scanActive = false;
  }

   async startScan() {

    // if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    //   try {
    //     const stream = await navigator.mediaDevices.getUserMedia({
    //       video: true
    //     });
    //     if (stream) {
    //       this.video.nativeElement.srcObject = stream;
    //       this.video.nativeElement.play();
    //       requestAnimationFrame(this.scan.bind(this));
    //       this.error = null;
    //     } else {
    //       this.error = 'You have no output video device';
    //     }
    //   } catch (e) {
    //     this.error = e;
    //   }
    // }

    // Not working on iOS standalone mode!
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });

  this.video.nativeElement.srcObject = stream;
  // Required for Safari
  this.video.nativeElement.setAttribute('playsinline', true);


    this.loading = await this.loadingCtrl.create({});
    await this.loading.present();

    this.video.nativeElement.play();
    requestAnimationFrame(this.scan.bind(this));
  }

  async scan() {
    if (this.video.nativeElement.readyState === this.video.nativeElement.HAVE_ENOUGH_DATA) {
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
        this.scanActive = true;
      }
      // console.log(this.video.nativeElement.videoHeight);
      // console.log(this.video.nativeElement);
      // console.log(this.canvas.nativeElement.height);
      this.canvas.nativeElement.height = this.video.nativeElement.videoHeight;
      this.canvas.nativeElement.width = this.video.nativeElement.videoWidth;

      this.canvas.nativeElement.getContext('2d').drawImage(
        this.video.nativeElement,
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height
      );
      const imageData = this.canvas.nativeElement.getContext('2d').getImageData(
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height
      );
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        this.scanActive = false;
        this.scanResult = code.data;
        // this.showQrToast();
      } else {
        if (this.scanActive) {
          requestAnimationFrame(this.scan.bind(this));
        }
      }
    } else {
      requestAnimationFrame(this.scan.bind(this));
    }
  }

  captureImage() {
    this.fileinput.nativeElement.click();
  }

  handleFile(files: FileList) {
    const file = files.item(0);

    const img = new Image();
    img.onload = () => {
      this.canvasContext.drawImage(img, 0, 0, this.canvasElement.width, this.canvasElement.height);
      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        this.scanResult = code.data;
        this.showQrToast();
      }
    };
    img.src = URL.createObjectURL(file);
  }
}
