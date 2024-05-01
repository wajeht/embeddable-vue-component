<script setup>
import { reactive, computed, onBeforeMount } from 'vue';

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
});

const states = reactive({
  enable: false,
  submitting: false,
  open: false,
  rating: 1,
  feedback: '',
  error: '',
  success: '',
});

function toggle() {
  states.open = !states.open;
}

onBeforeMount(async () => {
  try {
    const res = await fetch(`/api/feedback/${props.slug}`);
    if (res.ok && props.slug) {
      states.enable = true;
    }
  } catch (error) {
    console.log(error);
  }
});

async function submit() {
  states.submitting = true;
  states.error = '';
  states.success = '';

  try {
    const res = await fetch(`/api/feedback/${props.slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: states.rating,
        feedback: states.feedback,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    states.success = 'Thank you! 🙂';
  } catch (error) {
    if (error instanceof TypeError) {
      states.error = 'Network error. Please check your connection.';
    } else {
      states.error = error.message;
    }
  } finally {
    states.submitting = false;
  }
}

const computedSubmitText = computed(() => {
  if (states.submitting) {
    return 'Submitting...';
  }
  return 'Submit';
});
</script>

<template>
  <div v-if="states.enable" :class="{ 'hidden': !states.enable }" class="relative">
    <!-- Button to open/close the feedback form -->
    <button @click="toggle"
      class="fixed right-10 bottom-10 p-5 border bg-white hover:bg-blue-500 shadow-lg rounded-full w-[50px] h-[50px] flex justify-center items-center">
      😀
    </button>

    <!-- Feedback form with select dropdown for star rating and text feedback -->
    <div v-if="states.open"
      class="fixed right-10 bottom-28 p-5 border bg-white shadow-lg rounded-md w-[300px] h-auto flex flex-col gap-5">
      <!-- Error message -->
      <div v-if="states.error" class="bg-red-100 p-5 rounded-md flex flex-col gap-2 border border-red-200">
        {{ states.error }}
      </div>

      <!-- Success message -->
      <div v-if="states.success" class="bg-green-100 p-5 rounded-md flex flex-col gap-2 border border-green-200">
        {{ states.success }}
      </div>

      <!-- Select-based 5-Star Rating -->
      <div v-if="!states.success" class="bg-neutral-100 p-5 rounded-md flex flex-col gap-2">
        <span class="font-semibold">Rate your experience:</span>

        <select v-model="states.rating" class="p-2 rounded-md" :disabled="states.submitting">
          <option v-for="star in 5" :key="star" :value="star">{{ star }}</option>
        </select>
      </div>

      <!-- Text Feedback -->
      <div v-if="!states.success" class="bg-neutral-100 p-5 rounded-md flex flex-col gap-2">
        <label class="font-semibold" for="feedback">Your feedback:</label>
        <textarea id="feedback" v-model="states.feedback" class="w-full p-3 min-h-10 rounded-md"
          placeholder="Tell us about your experience..." :disabled="states.submitting"></textarea>
      </div>

      <!-- Submit Button -->
      <button v-if="!states.success" @click="submit" class="bg-blue-500 text-white p-3 rounded"
        :disabled="states.submitting">
        {{ computedSubmitText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url('./tailwind.css');
</style>
