let eventBus = new Vue()

Vue.component('vue-progress-bar', {
    template:`
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    `,
    data(){
        return{

        }
    },
    props: {
        max: {
            type: Number,
            default: 100,
        },
        value: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        progress() {
            return (this.value / this.max) * 100;
        },
    },
})
Vue.component('main-list', {
    template: `
    <div>
        <creating-notes></creating-notes>
        <note_column></note_column>
    </div>
    `
})

Vue.component('note_column', {

    template: `
        <div class="glob-list">
            <column class="note" :indexColumn="indexColumn1" :name="name" :col="note_column[0]" @changeTask="changeTask" :class="{block1col: block1col}" :block1col="block1col"></column>
            <column class="note" :indexColumn="indexColumn2" :name="name2" :col="note_column[1]" @changeTask="changeTask"></column>
            <column class="note" :indexColumn="indexColumn3" :name="name3" :col="note_column[2]" @changeTask="changeTask"></column>
        </div>
    `,
    data() {
        return {
            temporalCol: [],
            note_column: [
                [],
                [],
                [],
            ],

            name: 'Начало',
            name2: 'Дальше',
            name3: 'Конец',

            indexColumn1: 0,
            indexColumn2: 1,
            indexColumn3: 2,

            block1col: false,
        }
    },
    mounted() {
        const saveCols = localStorage.getItem('note_column')
        if(saveCols){
            this.note_column = JSON.parse(saveCols)
        }

        eventBus.$on('review-submitted', taskReview => {
            console.log(this.note_column[0].length);
            if (!this.block1col){
                if (this.note_column[0].length<3){
                    console.log('Notes', taskReview.Notes)
                    this.note_column[0].push(taskReview)
                    this.saveCols()
                }
            }
        })
    },
    watch:{
        note_column: {
            handler: 'saveCols',
            deep: true
        }
    },
    methods: {
        saveCols(){
            localStorage.setItem('note_column', JSON.stringify(this.note_column))
        },
        changeTask(task) {
            (!this.note_column[task.indexColumn][task.index].Notes[task.indexPuncts].done) ? this.note_column[task.indexColumn][task.index].Notes[task.indexPuncts].done = true : this.note_column[task.indexColumn][task.index].Notes[task.indexPuncts].done = false
            let movingTask = this.note_column[task.indexColumn][task.index]
            this.moveTask(movingTask, task)
            console.log('help', movingTask, task)
        },
        moveTask(movingTask, task) {
            let allLength = movingTask.Notes.length
            movingTask.cDone = 0
            for (let i of movingTask.Notes) {
                if (i.done === true) {
                    movingTask.cDone++
                }
            }
            console.log('ey',movingTask.cDone)
            if (movingTask.cDone > allLength / 2 && movingTask.cDone !== allLength && this.note_column[task.indexColumn] === this.note_column[0]) {
                if (this.note_column[1].length<5){
                    let move = this.note_column[task.indexColumn].splice(task.index, 1)
                    this.note_column[task.indexColumn + 1].push(...move)
                } else {
                    this.block1col = true
                }
            }

            if (movingTask.cDone === allLength) {
                let move = this.note_column[task.indexColumn].splice(task.index, 1)
                this.note_column[2].push(...move)
                this.dateTask(movingTask)
                this.block1col = false
            }
        },
        dateTask(movingTask){
            let date = new Date()
            let year = date.getFullYear()
            let month = date.getMonth()+1
            let day = date.getDate()
            let time = date.toLocaleTimeString()
            let strDate = year+'-'+month+'-'+day+' , '+time
            movingTask.dateEnd = strDate
        }
    },
})


Vue.component('column', {

    props: {
        col: {
            type: Array,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        indexColumn: {
            type: Number,
            required: true
        },
        block1col: {
            type: Boolean,
            required: false
        }
    },
    template: `
        <div>
            <h3>{{name}}</h3>
            <p>
               <div>
                <p v-if="!col.length">Нет тасков</p>

                  <ul>
                    <li
                    v-for="(pun, index) in col"
                    class="taskBorder"
                    >
                        <h3>{{pun.name}}</h3>
                        <p>{{pun.id}}</p>
                        <div>
                          <vue-progress-bar :max="100" :value="(pun.countDone/pun.Notes.length)*100"></vue-progress-bar>
                        </div>
                        <ul class="inUl">
                            <li
                              v-for="prop, indexPuncts in pun.Notes"
                              v-if="prop.notes!==null"
                              >
                                <label :for="pun.id">
                                <input
                                    type="checkbox"
                                    :disabled="prop.done || block1col"
                                    :checked="prop.done"
                                    id="pun.id"
                                    value="1"
                                    @change="changeTask(index, indexPuncts, indexColumn)"
                                    >{{prop.notes}}<p>{{prop.done}}</p></label><br>
                            </li>
                        </ul>
                        <p>{{pun.dateEnd}}</p>
                    </li>
                </ul>
            </div>
           </p>
        </div>
    `,
    data() {
        return {
            checkdTask: [],
            count: null,
            strDate: null
        }
    },
    methods: {

        changeTask(index, indexPuncts, indexColumn) {
            console.log(this.strDate)
            this.$emit('changeTask', {index, indexPuncts, indexColumn})
        },
    }
})

Vue.component('creating-notes', {
    template:`
        <div>
            <form class="review-form" @submit.prevent="onSubmit">
            <div class="container">
                <h3 class="logo">Поделись со мной своими мыслями и планами</h3>
                <p v-if="errors">
                    <b>Необходимое колличество пунктов от 3 до 5</b>
                </p>
                <div class="notes">
                    <label for="name">Название:</label>
                    <input required id="name" v-model="name" type="text">
                </div>
                <div class="notes">
                    <label for="notes1">Запись 1:</label>
                    <input id="notes1" v-model="notes1" type="text">
                </div>
                <div class="notes">
                    <label for="notes2">Запись 2:</label>
                    <input id="notes2" v-model="notes2" type="text">
                </div>
                <div class="notes">
                    <label for="notes3">Запись 3:</label>
                    <input id="notes3" v-model="notes3" type="text">
                </div>
                <div class="notes">
                    <label for="notes4">Запись 4:</label>
                    <input id="notes4" v-model="notes4" type="text">
                </div>
                <input  type="submit" value="Сохранить" class="submit">
            </div>
            </form>
        </div>
    `,
    data() {
        return {
            name: null,
            Notes:[],
            notes1: null,
            notes2: null,
            notes3: null,
            notes4: null,
            id: 1,
            cDone: 0,  // выполнено
            errors: 0,
            length: []  // проверка длинны
        }
    },
    methods: {
        onSubmit() {
            this.length = []
            this.length.push(
                this.notes1,
                this.notes2,
                this.notes3,
                this.notes4,
            )
            this.length = this.length.filter(Boolean);
            if (this.length.length > 2) {
                let taskReview = {
                    name: this.name,
                    Notes: [
                        {
                            notes: this.notes1,
                            done: false
                        },
                        {
                            notes: this.notes2,
                            done: false
                        },
                        {
                            notes: this.notes3,
                            done: false
                        },
                        {
                            notes: this.notes4,
                            done: false
                        },
                    ],
                    data:null,
                    id: this.id,
                    cDone: this.cDone
                }
                taskReview.Notes = this.removeEmptyValues(taskReview.Notes)
                this.idIncr()
                eventBus.$emit('review-submitted', taskReview)
                this.name = null
                this.notes1 = null
                this.notes2 = null
                this.notes3 = null
                this.notes4 = null
                this.CheckLength()

            } else {
                this.errors = 1
                this.CheckLength()
            }
        },
        idIncr() {
            this.id++
        },
        CheckLength() {
            return this.length = []
        },
        removeEmptyValues(arr) {

            arr = arr.filter(el => {
                if (el.notes !== null || '' || undefined) {
                    return el.notes;
                }

            })
            return arr
        }
    }
})

let app = new Vue({
    el: '#app',
    methods: {},
})



