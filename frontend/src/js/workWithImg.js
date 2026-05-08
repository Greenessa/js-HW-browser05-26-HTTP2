import SaveAppState from "./appState";


export default class workWithImg {
  constructor(storage) {
    // this.saveInStorage = storage;
    this.BASE_URL = "http://localhost:7070";
    this.dropzoneEl = document.querySelector(".form-container");
    this.removeEl = document.querySelector(".img-container");
    this.imgContainerEl = document.querySelector(".img-container");
    this.overlapEl = document.querySelector(".overlap");
    this.overlappedEl = document.querySelector(".overlapped");
    this.loadFile = this.loadFile.bind(this);
    this.loadImg = this.loadImg.bind(this);
    this.findImg = this.findImg.bind(this);
    this.removeImg = this.removeImg.bind(this);
    this.saveAppState = new SaveAppState();
    this.removeEl.addEventListener("click", this.removeImg);
    this.overlapEl.addEventListener("click", this.loadFile);
  }

  async loadImg() {
    // this.getListImg().then((array) => {
    //   this.saveAppState.imgArray = array.map((item) => item.src);
    //   this.addImg(this.saveAppState.imgArray);
    // })
    try {
      const array = await this.getListImg();
  
      this.saveAppState.imgArray = array.map((item) => item.src);
  
      this.addImg(this.saveAppState.imgArray);
    } catch (error) {
      console.error(error);
    }
  }

  async getListImg() {
    const response = await fetch(`${this.BASE_URL}/images`);

    if (!response.ok) {
      throw new Error("Не удалось загрузить список");
    }
    let result = await response.json();
    return result;
  }

  async loadFileOnServer (file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Не удалось");
      }
      let result = await response.json();
      console.log(result);
      return result;
    }
  
    async removeImage (filename) {
      const response = await fetch(`${this.BASE_URL}/?method=removeImage`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
      });
      if (!response.ok) {
        throw new Error("Не удалось");
      }
      let result = await response.json();
      return result;
    }
   

  loadFile() {
    this.overlappedEl.dispatchEvent(new MouseEvent("click"));
    this.overlappedEl.addEventListener("change", (evt) => {
      const files = Array.from(evt.currentTarget.files);
      console.log("evt.currentTarget.files", evt.currentTarget.files);
      console.log("files:", files);
      const file = files[0];
      if (files.length > 0) {
        console.log("Файл получен:", files[0].name);
        // Здесь надо oтобразить файл в контейнере
        this.loadFileOnServer(file).then((x) => {
          console.log(x.src);
          this.saveAppState.imgArray.push(x.src);
          this.addImg(this.saveAppState.imgArray);
          console.log(this.saveAppState.imgArray);
        });
        
      }
      evt.target.value = "";
    });
  }

  findImg() {
    ["dragover", "drop"].forEach((eventName) => {
      document.addEventListener(eventName, (e) => e.preventDefault());
    });
    this.dropzoneEl.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        console.log("Файл получен:", files[0].name);
        this.loadFileOnServer(files[0]).then((x) => {
          this.saveAppState.imgArray.push(x.src);
          this.addImg(this.saveAppState.imgArray);
        });
        // Здесь надо oтобразить файл в контейнере ниже (или прочитать его через FileReader)
      }
    });
  }

  addImg(array) {
    // Сначала очищаем контейнер
    let imgEls = document.querySelectorAll(".container");
    if (imgEls) {
      for (const imgEl of imgEls) {
        imgEl.remove();
      }
    }
    // Создаем и добавляем изображения
    for (const img of array) {
      let imgNewEl = document.createElement("div");
      imgNewEl.classList.add("container");
      let srsEl = document.createElement("img");
      srsEl.classList.add("picture");

      let butEl = document.createElement("button");
      butEl.classList.add("delete-button");
      butEl.innerHTML = "&times;";

      // Добавляем элементы в контейнер, но пока не добавляем в DOM
      imgNewEl.append(butEl, srsEl);

      // Обработчик успешной загрузки
      srsEl.onload = () => {
        // Проверяем размеры изображения
        if (srsEl.naturalWidth === 0 || srsEl.naturalHeight === 0) {
          srsEl.onerror();
          return;
        }
        // Если всё в порядке, добавляем контейнер в DOM
        this.imgContainerEl.append(imgNewEl);
      };

      // Обработчик ошибки загрузки
      srsEl.onerror = () => {
        console.error("Ошибка загрузки изображения:", img);
        // Не добавляем контейнер в DOM, если изображение не загрузилось
      };
      // Устанавливаем источник изображения после добавления обработчиков
      srsEl.src = img;
    }
  }

  removeImg(event) {
    // console.log(this.saveAppState.imgArray);
    if (event.target.classList.contains("delete-button")) {
      let srcImg = event.target
        .closest(".container")
        .querySelector(".picture")
        .getAttribute("src");
      event.target.closest(".container").remove();
      let name = srcImg.split('/').pop();
      this.removeImage(name).then((n)=> {
        console.log(n)
      })
      for (let i = this.saveAppState.imgArray.length - 1; i >= 0; i--) {
        if (this.saveAppState.imgArray[i] === srcImg) {
          this.saveAppState.imgArray.splice(i, 1);
        }
      }
    }
  }
}
