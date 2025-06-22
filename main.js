'use strict';

    const renderer = new THREE.WebGLRenderer({
		alpha: true
	});
    renderer.setClearColor(new THREE.Color('gray'), 0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = '0px';
	renderer.domElement.style.left = '0px';
	document.body.appendChild(renderer.domElement);

    const onRenderFcts = [];
    const arScene = new THREE.Scene();
    const arCamera = new THREE.Camera();
	arScene.add(arCamera);

    const arSource = new THREEx.ArToolkitSource({
		sourceType: 'webcam',
	});

	arSource.init(() => onResize());
	window.addEventListener('resize', () => onResize());

    function onResize() {
		arSource.onResizeElement();
		arSource.copyElementSizeTo(renderer.domElement);
		if (arContext.arController !== null) {
			arSource.copyElementSizeTo(arContext.arController.canvas);
		}
	}

    const arContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'ar-marker/camera_para.dat',
		detectionMode: 'mono',
		maxDetectionRate: 30,
		canvasWidth: 300,
		canvasHeight: 240
	})

    arContext.init(function onCompleted() {
		arCamera.projectionMatrix.copy(arContext.getProjectionMatrix());
	})

    onRenderFcts.push(function () {
		if (arSource.ready === false) return;
		arContext.update(arSource.domElement);
	})

    const markerRoot = new THREE.Group;
	arScene.add(markerRoot);

	new THREEx.ArMarkerControls(arContext, markerRoot, {
		type: 'pattern',
		patternUrl: 'ar-marker/marker.patt'
	});
		
	const smoothedRoot = new THREE.Group();
	arScene.add(smoothedRoot);
	
    const smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
		lerpPosition: 0.6,
		lerpQuaternion: 0.5,
		lerpScale: 1
	});

	onRenderFcts.push(function (delta) {
		smoothedControls.update(markerRoot)
	});

    const arWorldRoot = smoothedRoot;
	const geometry = new THREE.BoxGeometry(1, 0.1, 1);
	const material = new THREE.MeshNormalMaterial({
		transparent: true,
		opacity: 0.25,
		side: THREE.DoubleSide
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = geometry.parameters.height / 2;
	arWorldRoot.add(mesh);
	
    loadSurface();

    const stats = new Stats();
	document.body.appendChild(stats.dom);
		
	onRenderFcts.push(function () {
		renderer.render(arScene, arCamera);
		stats.update();
	})

	let lastTimeMsec = null
	requestAnimationFrame(function animate(nowMsec) {
        requestAnimationFrame(animate);
		lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
		const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
		lastTimeMsec = nowMsec;
		onRenderFcts.forEach(function (onRenderFct) {
			onRenderFct(deltaMsec / 1000, nowMsec / 1000)
		})
	});