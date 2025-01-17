import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, type ElementRef } from '@angular/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { InMemoryLaodMAanger } from './in-memory-laod-manager';
import { AmbientLight, Color, DirectionalLight, MeshBasicMaterial, PCFSoftShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
@Component({
  selector: 'app-3ddisplay',
  templateUrl: './3ddisplay.component.html',
  styleUrls: ['./3ddisplay.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ThreeDdisplayComponent implements OnInit {

  @Input()
  model: File

  @ViewChild("displaycanvas")
  canvasRef: ElementRef<HTMLCanvasElement>
  renderer: WebGLRenderer;
  controls: OrbitControls;
  scene: Scene;


  constructor() {}

  ngOnInit() {

    const url = URL.createObjectURL(this.model)
    //new InMemoryLaodMAanger({ "gldb": this.model }url
    const loader = new GLTFLoader()

    loader.load(url, (gltf) => {

      debugger
      this.scene.add(gltf.scene)
    }, undefined, function (error) {
      debugger
      console.error(error);

    });
  }

  ngAfterViewInit() {


    this.scene = new Scene()
    this.scene.background = new Color(0xa3a3a3);

    this.scene.add(new AmbientLight(0xffffff, 1))

    this.renderer = new WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      context: this.canvasRef.nativeElement.getContext("webgl2") as WebGLRenderingContext,
      antialias: true
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    //this.renderer.setPixelRatio(window.devicePixelRatio * 5)

    const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    this.controls = new OrbitControls(camera, this.renderer.domElement);
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 600;
    this.controls.maxPolarAngle = Math.PI / 2;

    const directionalLight = new DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 5, 5); // Move light to an angle
    this.scene.add(directionalLight);

    const animate = () => {
      this.renderer.render(this.scene, camera);

    }
    this.renderer.setAnimationLoop(animate);
  }

}
